// A tiny stand-in for the NestJS backend, so the browser tests exercise the
// real Next.js app (pages, server actions, the /api/auth rewrite, the proxy)
// without a database or an SMTP server. It mimics only the endpoints the
// tests need, with the same response shapes as apps/backend.
import { createServer } from "node:http";
import process from "node:process";

// Usage: node stub-backend.mjs [port]
const PORT = Number(process.argv[2] ?? 4010);
const WISHLIST_ID = "11111111-1111-4111-8111-111111111111";
const GIFT_IDS = {
  headphones: "22222222-2222-4222-8222-222222222221",
  lamp: "22222222-2222-4222-8222-222222222222",
};

const users = {
  olga: {
    id: 1,
    name: "Olga Owner",
    email: "olga@example.com",
    token: "tok-olga",
  },
  ann: { id: 2, name: "Ann Guest", email: "ann@example.com", token: "tok-ann" },
  bob: { id: 3, name: "Bob Buyer", email: "bob@example.com", token: "tok-bob" },
};
const PASSWORD = "secret123";
const byToken = (token) => Object.values(users).find((u) => u.token === token);

let state;
function reset() {
  state = {
    wishlists: [
      {
        id: WISHLIST_ID,
        userId: users.olga.id,
        title: "Olga turns 30",
        occasion: "birthday",
        date: "2026-11-14",
        note: "Surprise me",
        currency: "EUR",
      },
    ],
    gifts: [
      {
        id: GIFT_IDS.headphones,
        wishlistId: WISHLIST_ID,
        name: "Headphones",
        description: "Wireless",
        price: 99,
        url: null,
        imageUrl: null,
        reservers: [],
      },
      {
        id: GIFT_IDS.lamp,
        wishlistId: WISHLIST_ID,
        name: "Desk lamp",
        description: null,
        price: 35.5,
        url: null,
        imageUrl: null,
        reservers: [users.bob.id],
      },
    ],
  };
}
reset();

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data ? JSON.parse(data) : {}));
  });

function publicGift(gift, viewer, isOwner) {
  const holders = isOwner
    ? []
    : gift.reservers.map((id) => Object.values(users).find((u) => u.id === id));
  return {
    id: gift.id,
    name: gift.name,
    description: gift.description,
    price: gift.price,
    url: gift.url,
    imageUrl: gift.imageUrl,
    reserved: holders.length > 0,
    reservedByMe: holders.some((u) => u.id === viewer.id),
    reservers: holders.map((u) => ({ name: u.name, isMe: u.id === viewer.id })),
    myRequest: null,
    incomingRequests: [],
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://stub");
  const path = url.pathname;
  const bearer = req.headers.authorization?.replace("Bearer ", "");
  const viewer = bearer ? byToken(bearer) : undefined;

  if (path === "/__reset") {
    reset();
    return json(res, 204);
  }

  if (path === "/api/auth/sign-in/email" && req.method === "POST") {
    const { email, password } = await readBody(req);
    const user = Object.values(users).find((u) => u.email === email);
    if (!user || password !== PASSWORD) {
      return json(res, 401, {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      });
    }
    return json(
      res,
      200,
      { token: user.token, user },
      {
        "Set-Cookie": `better-auth.session_token=${user.token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    );
  }

  if (path === "/api/auth/sign-out" && req.method === "POST") {
    return json(
      res,
      200,
      { success: true },
      {
        "Set-Cookie": "better-auth.session_token=; Path=/; HttpOnly; Max-Age=0",
      },
    );
  }

  if (path === "/api/auth/request-password-reset" && req.method === "POST") {
    // Like better-auth: the same answer whether or not the account exists.
    return json(res, 200, { status: true });
  }

  if (path === "/api/auth/reset-password" && req.method === "POST") {
    const { token } = await readBody(req);
    if (token !== "valid-token") {
      return json(res, 400, {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      });
    }
    return json(res, 200, { status: true });
  }

  if (path === "/api/auth/change-password" && req.method === "POST") {
    const { currentPassword } = await readBody(req);
    if (currentPassword !== PASSWORD) {
      return json(res, 400, {
        code: "INVALID_PASSWORD",
        message: "Invalid password",
      });
    }
    return json(res, 200, { token: null });
  }

  if (path === "/api/auth/list-accounts") {
    return json(res, 200, viewer ? [{ providerId: "credential" }] : []);
  }

  if (path === "/api/auth/get-session") {
    return json(
      res,
      200,
      viewer ? { user: viewer, session: { token: viewer.token } } : null,
    );
  }

  const preview = path.match(/^\/public\/wishlists\/([^/]+)\/preview$/);
  if (preview) {
    const list = state.wishlists.find((w) => w.id === preview[1]);
    if (!list) return json(res, 404, { message: "Wishlist not found" });
    const owner = Object.values(users).find((u) => u.id === list.userId);
    return json(res, 200, {
      id: list.id,
      title: list.title,
      occasion: list.occasion,
      date: list.date,
      ownerName: owner.name,
    });
  }

  if (!viewer) return json(res, 401, { message: "Unauthorized" });

  if (path === "/wishlists" && req.method === "GET") {
    return json(
      res,
      200,
      state.wishlists
        .filter((w) => w.userId === viewer.id)
        .map((w) => ({
          ...w,
          giftsCount: state.gifts.filter((g) => g.wishlistId === w.id).length,
        })),
    );
  }

  const shared = path.match(/^\/public\/wishlists\/([^/]+)$/);
  if (shared && req.method === "GET") {
    const list = state.wishlists.find((w) => w.id === shared[1]);
    if (!list) return json(res, 404, { message: "Wishlist not found" });
    const owner = Object.values(users).find((u) => u.id === list.userId);
    const isOwner = list.userId === viewer.id;
    return json(res, 200, {
      id: list.id,
      title: list.title,
      occasion: list.occasion,
      date: list.date,
      note: list.note,
      currency: list.currency,
      ownerName: owner.name,
      isOwner,
      gifts: state.gifts
        .filter((g) => g.wishlistId === list.id)
        .map((g) => publicGift(g, viewer, isOwner)),
    });
  }

  const reservation = path.match(
    /^\/public\/wishlists\/([^/]+)\/gifts\/([^/]+)\/reservation$/,
  );
  if (reservation) {
    const gift = state.gifts.find(
      (g) => g.id === reservation[2] && g.wishlistId === reservation[1],
    );
    if (!gift) return json(res, 404, { message: "Gift not found" });
    if (req.method === "PUT") {
      if (gift.reservers.length > 0)
        return json(res, 409, { message: "Gift is already reserved" });
      gift.reservers.push(viewer.id);
      return json(res, 204);
    }
    if (req.method === "DELETE") {
      if (!gift.reservers.includes(viewer.id))
        return json(res, 403, {
          message: "You have no reservation on this gift",
        });
      gift.reservers = gift.reservers.filter((id) => id !== viewer.id);
      return json(res, 204);
    }
  }

  json(res, 404, { message: `Stub has no ${req.method} ${path}` });
}).listen(PORT, "127.0.0.1", () => console.log(`Stub backend on :${PORT}`));
