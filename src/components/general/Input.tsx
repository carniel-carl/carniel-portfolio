import React, {
  DetailedHTMLProps,
  ForwardedRef,
  forwardRef,
  InputHTMLAttributes,
  useState,
} from "react";

interface InputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  // error?: string | null;
  label: string;
  // variant: "primary" | "search" | "regular";
}

const Input = forwardRef(
  (
    { className, label, ...props }: InputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const [showPassword] = useState(false);

    // SUB: Show/hide password handler
    // const showPasswordHandler = () => {
    //   setShowPassword((prev) => !prev);
    // };
    const inputType =
      props?.type === "password"
        ? showPassword
          ? "text"
          : "password"
        : props?.type;
    return (
      <div className="input-area">
        <input
          ref={ref}
          type={inputType}
          className={`input ${className}`}
          {...props}
        />
        <label htmlFor={props.id} className="label">
          {label}
        </label>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
