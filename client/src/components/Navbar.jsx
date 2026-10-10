import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.navbar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>{'</>'}</span>
        <span className={styles.logoText}>DevVault</span>
      </div>

      <div className={styles.right}>
        <div className={styles.userInfo}>
          <User size={15} />
          <span>{user?.username}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Sign out">
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
