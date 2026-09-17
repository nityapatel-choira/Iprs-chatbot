import { useEffect, useRef } from "react";

const PayURedirect = ({ payuPayload }) => {
  const formRef = useRef(null);

  useEffect(() => {
    if (payuPayload && formRef.current) {
      // Store the txnId for status verification after PayU redirect
      const txnId = payuPayload.txnId || payuPayload.params?.txnid || payuPayload.payment?.txnId;
      if (txnId) {
        localStorage.setItem("payu_txnId", txnId);
      }
      // Auto-submit the form as soon as it renders
      formRef.current.submit();
    }
  }, [payuPayload]);

  if (!payuPayload) return null;

  // PayU endpoint: Use the one provided in payload, default to test environment if missing.
  const actionUrl = payuPayload.actionUrl || payuPayload.payuUrl || payuPayload.action || "https://test.payu.in/_payment";
  const params = payuPayload.params || payuPayload; // fallback for old format

  // Filter out the action/payuUrl/actionUrl from the payload fields if they were included
  const fields = Object.entries(params).filter(([key]) => key !== "actionUrl" && key !== "payuUrl" && key !== "action");

  return (
    <div style={{ display: "none" }}>
      <form ref={formRef} action={actionUrl} method="POST">
        {fields.map(([key, value]) => {
          if (value === undefined || value === null) return null;
          return <input key={key} type="hidden" name={key} value={value} />;
        })}
      </form>
    </div>
  );
};

export default PayURedirect;
