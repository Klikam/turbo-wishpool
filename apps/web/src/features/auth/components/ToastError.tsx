interface ToastErrorProps {
  message: string;
}

export default function ToastError({ message }: ToastErrorProps) {
  return (
    <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
      {message}
    </p>
  );
}
