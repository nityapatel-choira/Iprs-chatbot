import iprsLogo from "../../../../assets/iprs-logo.png";
import styles from "../../Chat.module.css";

const BotAvatar = () => {
  return (
    <span className={styles.avatar} aria-hidden="true">
      <img src={iprsLogo} alt="" />
    </span>
  );
};

export default BotAvatar;
