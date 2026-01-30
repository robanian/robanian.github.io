import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.neonTitle}>
          <h1 className="hero__title">
            {siteConfig.title}
          </h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
        </div>
        
        <div className={styles.techStack}>
          <span className={styles.techBadge}>🏗️ Infrastructure</span>
          <span className={styles.techBadge}>⚙️ Backend</span>
          <span className={styles.techBadge}>🎮 Game Engine</span>
          <span className={styles.techBadge}>🎨 Frontend</span>
          <span className={styles.techBadge}>🤖 AI</span>
        </div>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            📚 Read Tech Docs
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/blog">
            📝 View Blog Posts
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureSection() {
  const features = [
    {
      title: '🏗️ Infrastructure',
      description: 'Docker + Portainer + GitHub Actions CI/CD, Nginx Proxy Manager + Cloudflare, Grafana + Prometheus + Loki monitoring',
      gradient: 'linear-gradient(135deg, #4D9EFF 0%, #00F0FF 100%)',
    },
    {
      title: '⚙️ Backend Architecture',
      description: 'Node.js/Express + Prisma ORM, Schema-driven design with 17+ tables, Modular Monolithic → MSA Ready',
      gradient: 'linear-gradient(135deg, #00F0FF 0%, #B544FE 100%)',
    },
    {
      title: '🎮 Real-time Streaming',
      description: 'Unreal Engine 5.5 + WebRTC, Pixel Streaming with DLSS optimization, Multi-server matchmaker system',
      gradient: 'linear-gradient(135deg, #B544FE 0%, #FF2E97 100%)',
    },
    {
      title: '🤖 AI Integration',
      description: 'Pinecone vector DB + OpenAI embeddings, RAG-based intelligent recommendations, Custom ML models with OpenCV',
      gradient: 'linear-gradient(135deg, #FF2E97 0%, #39FF14 100%)',
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Core Expertise</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureGradient} style={{background: feature.gradient}}></div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectHighlight() {
  return (
    <section className={styles.projectSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Featured Project</h2>
        <div className={styles.projectCard}>
          <div className={styles.projectHeader}>
            <h3>🏠 DDukDDak - AI Interior Design Platform</h3>
            <span className={styles.projectStatus}>🚀 Launching Feb 2025</span>
          </div>
          <p className={styles.projectDescription}>
            Real-time 3D visualization through pixel streaming with AI consultation services.
            Combining Unreal Engine 5.5, WebRTC streaming, and GPT-4 powered recommendations.
          </p>
          <div className={styles.projectTech}>
            <span>UE5.5</span>
            <span>Node.js</span>
            <span>Next.js</span>
            <span>Prisma</span>
            <span>WebRTC</span>
            <span>OpenAI</span>
            <span>Pinecone</span>
          </div>
          <Link to="/docs/projects/ddukddak" className={styles.projectLink}>
            Learn More →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Backend Architecture & Infrastructure, WebRTC Real-time 3D Streaming">
      <HomepageHeader />
      <main>
        <FeatureSection />
        <ProjectHighlight />
      </main>
    </Layout>
  );
}
