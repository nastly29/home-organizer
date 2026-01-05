import { useState } from "react";

export default function PasswordField({
  id,
  label = "Пароль",
  value,
  onChange,
  onBlur,
  error,
  autoComplete = "current-password",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>

      <div className="input-group auth-input-group">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`form-control ${error ? "is-invalid" : ""}`}
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          className="btn btn-outline-primary auth-eye-btn"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Сховати пароль" : "Показати пароль"}
        >
          <i className={`bi ${show ? "bi-eye" : "bi-eye-slash"}`} />
        </button>
      </div>

      {error ? <div className="invalid-feedback d-block">{error}</div> : null}
    </div>
  );
}
