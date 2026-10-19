'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './about.module.css';

const achievements = [
  {
    src: '/1.jpeg',
    alt: 'Sriram & Co receiving an award from industry partners',
    caption: 'Recognition from our industry partners',
  },
  {
    src: '/2.jpeg',
    alt: 'Sriram & Co team receiving a store award',
    caption: 'A proud moment with our store team',
  },
  {
    src: '/3.jpeg',
    alt: 'Award presentation at Dharmapuri Build Expo 2023',
    caption: 'Recognized at Dharmapuri Build Expo 2023',
  },
  {
    src: '/4.jpeg',
    alt: 'Sriram & Co receiving recognition at a product event',
    caption: 'Celebrating recognition at a product event',
  },
  {
    src: '/5.jpeg',
    alt: 'Sriram & Co team with an award at the store',
    caption: 'Celebrating achievements together',
  },
];

export default function AchievementsGallery() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof achievements)[number] | null>(null);

  useEffect(() => {
    if (!selectedPhoto) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [selectedPhoto]);

  return (
    <>
      <div className={styles.achievementsGrid}>
        {achievements.map((achievement) => (
          <figure key={achievement.src} className={styles.achievementCard}>
            <button
              type="button"
              className={styles.achievementButton}
              aria-label={`View photo: ${achievement.caption}`}
              onClick={() => setSelectedPhoto(achievement)}
            >
              <img src={achievement.src} alt={achievement.alt} className={styles.achievementImage} />
            </button>
            <figcaption>{achievement.caption}</figcaption>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.photoDialog}
        aria-label="Achievement photo viewer"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onClose={() => setSelectedPhoto(null)}
      >
        {selectedPhoto && (
          <div className={styles.photoDialogContent}>
            <button
              type="button"
              className={styles.photoDialogClose}
              aria-label="Close photo viewer"
              onClick={() => dialogRef.current?.close()}
            >
              &times;
            </button>
            <img src={selectedPhoto.src} alt={selectedPhoto.alt} className={styles.enlargedPhoto} />
            <p>{selectedPhoto.caption}</p>
          </div>
        )}
      </dialog>
    </>
  );
}
