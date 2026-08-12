import Navbar from "../../components/Navbar/Navbar";
import styles from "./MainLayout.module.css";

function MainLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default MainLayout;
