export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <p className="text-xs text-critical" role="alert">
      {errors[0]}
    </p>
  );
}
