import React from 'react';
import styles from './AnnouncementBar.module.css';

export default function AnnouncementBar() {
  return (
    <div className={styles.bar}>
      <div className="container">
        <p className={styles.text}>
          Free delivery on orders above ₹1,000 • Fast dispatch from Trichy &amp; Chennai branches • 100% Genuine Guarantee
        </p>
      </div>
    </div>
  );
}
