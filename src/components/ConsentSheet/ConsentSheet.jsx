import BottomSheet from "../BottomSheet/BottomSheet";
import styles from "./ConsentSheet.module.css";
import { t } from "../../i18n";

const ConsentSheet = ({ open, title, children, onAccept, onBack }) => {
  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onBack}
      footer={
        <>
          <button type="button" className={styles.backButton} onClick={onBack}>
            {t("Go back")}
          </button>
          <button type="button" className={styles.acceptButton} onClick={onAccept}>
            {t("I Accept")}
          </button>
        </>
      }
    >
      {children}
    </BottomSheet>
  );
};

export default ConsentSheet;
