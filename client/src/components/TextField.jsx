export default function TextField({
    id,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    autoComplete,
  }) {
    return (
      <div className="mb-3">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
  
        <input
          id={id}
          type={type}
          className={`form-control ${error ? "is-invalid" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
        />
  
        {error ? <div className="invalid-feedback">{error}</div> : null}
      </div>
    );
  }
  