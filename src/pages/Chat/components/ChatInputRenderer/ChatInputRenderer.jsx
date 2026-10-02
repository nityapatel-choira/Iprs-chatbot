import QuickReplyCard from "../../../../components/QuickReplyCard/QuickReplyCard";
import PinInput from "../../../../components/PinInput/PinInput";
import CheckboxGroup from "../../../../components/CheckboxGroup/CheckboxGroup";
import FeeSummaryCard from "../../../../components/FeeSummaryCard/FeeSummaryCard";
import DocumentScanCard from "../../../../components/DocumentScanCard/DocumentScanCard";
import PassportPhotoCard from "../PassportPhotoCard/PassportPhotoCard";
import FileUploader from "../../../../components/FileUploader/FileUploader";
import { t, t1 } from "../../../../i18n";

const ChatInputRenderer = ({
  input,
  isTyping,
  isPaymentReviewStep,
  isCityStep,
  textConfig,
  isConsentAcceptStep,
  pendingDocSummary,
  isPayAction,
  triggerPayment,
  sendAnswer,
  resendCountdown,
  isPassportPhotoStep,
  isProfilePhotoStep,
  submitFile,
  uploadStatus,
  uploadProgress,
  uploadError,
  uploadForInputId,
}) => {
  if (isTyping || !input) return null;

  const isUploadForCurrentInput = input?.type === "file input" && uploadForInputId === input.id;
  const effectiveUploadStatus = isUploadForCurrentInput ? uploadStatus : "idle";
  const effectiveUploadProgress = isUploadForCurrentInput ? uploadProgress : 0;
  const effectiveUploadError = isUploadForCurrentInput ? uploadError : "";

  const renderResendQuickReplyCard = () => (
    <QuickReplyCard
      options={(input.items || []).map((item) => {
        const rawLabel = item.content || item.label || String(item);
        const isResend = rawLabel === t("Resend OTP") || /resend/i.test(rawLabel);
        const disabled = isResend && resendCountdown > 0;
        return {
          label: disabled ? t1("Resend in {0}s", resendCountdown) : rawLabel,
          id: item.id,
          disabled,
          actionLabel: rawLabel,
        };
      })}
      onSelect={(option) => {
        if (option.disabled) return;
        sendAnswer(option.actionLabel || option.label);
      }}
    />
  );

  if (isPaymentReviewStep) return null;
  if (isCityStep) return null;

  if (textConfig && Array.isArray(input.items) && input.items.length > 0) {
    return renderResendQuickReplyCard();
  }

  if (input?.type === "choice input" && !isConsentAcceptStep && !pendingDocSummary) {
    return (
      <QuickReplyCard
        options={(input.items || []).map((item) => ({ label: item.content || item.label, id: item.id || item.value || item.key }))}
        onSelect={(option) => {
          if (isPayAction(option.label, (input.items || []).length)) {
            triggerPayment();
          } else {
            sendAnswer(option.label);
          }
        }}
      />
    );
  }

  if (input?.type === "otp input") {
    return (
      <>
        <PinInput key={input.id} onComplete={sendAnswer} />
        {Array.isArray(input.items) && input.items.length > 0 && (
          <div style={{ marginTop: '0.75rem', width: '100%' }}>
            {renderResendQuickReplyCard()}
          </div>
        )}
      </>
    );
  }

  if (input?.type === "checkbox input") {
    return (
      <CheckboxGroup
        options={input.options || []}
        caption={input.caption}
        onSubmit={(selected) => sendAnswer(selected.map((opt) => opt.label).join(", "))}
      />
    );
  }

  if (input?.type === "summary input") {
    return (
      <FeeSummaryCard
        key={input.id}
        {...input.data}
        onOptionSelect={(option) => {
          if (isPayAction(option.label, (input.items || []).length)) {
            triggerPayment();
          } else {
            sendAnswer(option.label);
          }
        }}
        onConfirm={() => {
          const label = input.data?.confirmLabel || "Confirmed";
          if (isPayAction(label)) {
            triggerPayment();
          } else {
            sendAnswer(label);
          }
        }}
      />
    );
  }

  if (input?.type === "document input") {
    return (
      <DocumentScanCard
        key={input.id}
        title={input.title}
        caption={input.caption}
        onCapture={() => sendAnswer("Document captured", t("Document captured"))}
      />
    );
  }

  if (input?.type === "file input" && (isPassportPhotoStep || isProfilePhotoStep)) {
    return (
      <PassportPhotoCard
        key={input.id}
        title={input.title || (isProfilePhotoStep ? t("Upload your Profile photo") : undefined)}
        caption={input.caption}
        onFileSelected={submitFile}
        status={effectiveUploadStatus}
        progress={effectiveUploadProgress}
        errorMessage={effectiveUploadError}
      />
    );
  }

  if (input?.type === "file input") {
    return (
      <FileUploader
        key={input.id}
        title={input.title || t("Choose a file or drag & drop it here")}
        caption={input.caption || "PNG, JPG/JPEG, PDF"}
        onFileSelected={submitFile}
        status={effectiveUploadStatus}
        progress={effectiveUploadProgress}
        errorMessage={effectiveUploadError}
        disabled={effectiveUploadStatus === "uploading" || effectiveUploadStatus === "processing"}
        requireRearCamera={input.id?.includes("document")}
      />
    );
  }

  return null;
};

export default ChatInputRenderer;
