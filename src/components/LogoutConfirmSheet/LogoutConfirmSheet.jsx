import BottomSheet from "../BottomSheet/BottomSheet";
import styles from "./LogoutConfirmSheet.module.css";
import { t } from "../../i18n";

const LogoutConfirmSheet = ({ open, onConfirm, onCancel }) => {
  return (
    <BottomSheet
      open={open}
      title={t("Logout Confirmation")}
      onClose={onCancel}
      hideDivider={true}
      footer={
        <>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            {t("Cancel")}
          </button>
          <button type="button" className={styles.logoutButton} onClick={onConfirm}>
            {t("Yes, Log out")}
          </button>
        </>
      }
    >
      <p className={styles.bodyText}>{t("Are you sure you want to log out?")}</p>
    </BottomSheet>
  );
};

export default LogoutConfirmSheet;
