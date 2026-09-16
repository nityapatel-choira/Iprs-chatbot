import { useEffect, useRef } from "react";

const PayURedirect = ({ payuPayload }) => {
  const formRef = useRef(null);

  useEffect(() => {
    if (payuPayload && formRef.current) {
      // Auto-submit the form as soon as it renders
      formRef.current.submit();
    }
  }, [payuPayload]);

  if (!payuPayload) return null;

  // PayU endpoint: Use the one provided in payload, default to test environment if missing.
  const payuUrl = payuPayload.payuUrl || payuPayload.action || "https://test.payu.in/_payment";

  // Filter out the action/payuUrl from the payload fields if they were included
  const fields = Object.entries(payuPayload).filter(([key]) => key !== "payuUrl" && key !== "action");

  return (
    <div style={{ display: "none" }}>
      <form ref={formRef} action={payuUrl} method="POST">
        {fields.map(([key, value]) => {
          if (value === undefined || value === null) return null;
          return <input key={key} type="hidden" name={key} value={value} />;
        })}
      </form>
    </div>
  );
};

export default PayURedirect;
