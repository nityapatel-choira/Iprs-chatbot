import Navbar from "../../components/Navbar/Navbar";
import styles from "./MainLayout.module.css";

export default function MainLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
