import BottomSheet from "../BottomSheet/BottomSheet";
import styles from "./ConsentSheet.module.css";

function ConsentSheet({ open, title, children, onAccept, onBack }) {
  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onBack}
      footer={
        <>
          <button type="button" className={styles.backButton} onClick={onBack}>
            Go back
          </button>
          <button type="button" className={styles.acceptButton} onClick={onAccept}>
            I Accept
          </button>
        </>
      }
    >
      {children}
    </BottomSheet>
  );
}

export default ConsentSheet;
