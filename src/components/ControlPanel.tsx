"use client";
import styles from "./ControlPanel.module.css";

interface ControlPanelProps {
  onReset: () => void;
}

export function ControlPanel({ onReset }: ControlPanelProps) {

  return (
    <div className={styles.panelContainer}>
      <h3 className={styles.panelTitle}>Game Controls</h3>

      <button
        onClick={onReset}
        className={styles.controlButton}
      >
        Reset Game
      </button>

      <div className={styles.instructionsBox}>
        <div className={styles.instructionsTitle}>Controls:</div>
        <div className={styles.instructionItem}>• Reset Game - Start new game</div>
      </div>
    </div>
  );
}
