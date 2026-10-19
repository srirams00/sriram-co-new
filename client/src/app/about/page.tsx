import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Award, HeartHandshake, MapPin } from 'lucide-react';
import AchievementsGallery from './AchievementsGallery';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About Us — 35 Years of Trusted Guidance & Quality Tools',
  description: 'Learn about Sriram & Co, founded in Trichy and expanding to Chennai. Providing genuine home appliances, power tools, and honest store service for over 35 years.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Sri Ram & Co — Our Legacy & Values',
    description: 'Providing genuine home appliances, power tools, and honest store service for over 35 years across Trichy and Chennai.',
    url: '/about',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      {/* Hero Banner */}
      <section className={styles.banner}>
        <div className="container">
          <span className="text-eyebrow">Our Legacy</span>
          <h1 className="heading-hero">35 Years of Honest Guidance &amp; Quality Tools</h1>
          <p className={styles.bannerLead}>
            Since 2007, Sriram &amp; Co has been the trusted destination for home appliances, power tools, and kitchen essentials in Trichy and Chennai.
          </p>
        </div>
      </section>

      {/* Achievements */}
      <section className={styles.achievementsSection}>
        <div className="container">
          <div className={styles.achievementsHeader}>
            <span className="text-eyebrow">Milestones &amp; Recognition</span>
            <h2 className="heading-section">Proud moments along the way</h2>
            <p className={styles.achievementsLead}>
              We are grateful for the recognition and relationships built with our customers, partners, and community.
            </p>
          </div>

          <AchievementsGallery />
        </div>
      </section>

      {/* Core Values */}
      <section className={styles.valuesSection}>
        <div className="container">
          <div className={styles.valuesHeader}>
            <h2 className="heading-section">What Sets Sriram &amp; Co Apart</h2>
            <p className={styles.valuesLead}>Four pillars that guide every interaction with our customers.</p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <ShieldCheck size={24} />
              </div>
              <h3>100% Genuine Guarantee</h3>
              <p>Every product is sourced directly from authorized manufacturers with full serial warranty registration.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <Award size={24} />
              </div>
              <h3>Tested for Durability</h3>
              <p>We hand-select models known for enduring heavy Indian electrical conditions, hard water, and frequent use.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <HeartHandshake size={24} />
              </div>
              <h3>Direct After-Sales Care</h3>
              <p>Need a replacement coupler, spare blade, or warranty service? You speak to our store, not a distant call center.</p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>
                <MapPin size={24} />
              </div>
              <h3>Local Store Dispatch</h3>
              <p>Direct packing and doorstep delivery by our dedicated staff across Trichy, Chennai, and Tamil Nadu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="section">
        <div className={`container ${styles.storyGrid}`}>
          <div className={styles.storyVisual}>
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
              alt="Store team and appliances"
              className={styles.storyImage}
            />
          </div>

          <div className={styles.storyContent}>
            <span className="text-eyebrow">How We Began</span>
            <h2 className="heading-section">Built on straightforward advice, not sales pressure.</h2>
            <p>
              When Sriram &amp; Co first opened our doors on West Boulevard Road in Trichy, we made a simple promise: never recommend an appliance or a power tool that we wouldn't use in our own homes.
            </p>
            <p>
              Over three decades later, that founding philosophy remains unchanged. In a world full of confusing specifications, disposable gadgets, and impersonal delivery apps, we believe in standing behind every single product we sell.
            </p>
            <p>
              Whether you are a homeowner upgrading your kitchen, a hobbyist setting up a workshop, or a contractor outfitting a work crew, our team takes the time to understand your exact needs before recommending a solution.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>Experience the Sriram &amp; Co Difference</h2>
            <p>Explore our catalog of curated home appliances, power tools, and everyday essentials.</p>
            <div className={styles.ctaButtons}>
              <Link href="/shop" className="btn btn-primary btn-lg">
                Browse All Products
              </Link>
              <Link href="/contact" className="btn btn-secondary btn-lg">
                Visit Our Stores
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
