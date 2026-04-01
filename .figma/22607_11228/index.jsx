import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame}>
      <div className={styles.dashboardSummaryCard}>
        <div className={styles.summaryContainer}>
          <div className={styles.frame1618867925}>
            <p className={styles.totalRevnue}>Total Revnue</p>
            <p className={styles.a15837}>$15,837</p>
            <p className={styles.a23VsYesterday}>+ 2.3% vs Yesterday</p>
          </div>
          <div className={styles.frame1618867923}>
            <img
              src="../image/mnfy487h-lmd1v3h.svg"
              className={styles.component30}
            />
          </div>
        </div>
        <img src="../image/mnfy487h-zlws5y3.png" className={styles.group} />
      </div>
      <div className={styles.dashboardSummaryCard2}>
        <div className={styles.summaryContainer2}>
          <div className={styles.frame16188679252}>
            <p className={styles.totalUsers}>Total users</p>
            <p className={styles.a100000}>100,000</p>
            <p className={styles.a23VsYesterday2}>+ 2.3% vs Yesterday</p>
          </div>
          <div className={styles.frame16188679232}>
            <img
              src="../image/mnfy487h-qbnewaq.svg"
              className={styles.component30}
            />
          </div>
        </div>
        <img src="../image/mnfy487h-9hveie0.png" className={styles.group2} />
      </div>
      <div className={styles.dashboardSummaryCard2}>
        <div className={styles.summaryContainer2}>
          <div className={styles.frame16188679252}>
            <p className={styles.totalUsers}>Total Contractors</p>
            <p className={styles.a100000}>100,000</p>
            <p className={styles.a23VsYesterday2}>+ 2.3% vs Yesterday</p>
          </div>
          <div className={styles.frame16188679232}>
            <img
              src="../image/mnfy487h-x3wyum0.svg"
              className={styles.component30}
            />
          </div>
        </div>
        <img src="../image/mnfy487h-9hveie0.png" className={styles.group2} />
      </div>
      <div className={styles.dashboardSummaryCard3}>
        <div className={styles.summaryContainer2}>
          <div className={styles.frame16188679252}>
            <p className={styles.totalUsers}>Total Request&nbsp;</p>
            <p className={styles.a100000}>100,000</p>
            <p className={styles.a23VsYesterday2}>+ 2.3% vs Yesterday</p>
          </div>
          <div className={styles.frame16188679232}>
            <img
              src="../image/mnfy487h-rkf9y2n.svg"
              className={styles.component30}
            />
          </div>
        </div>
        <img src="../image/mnfy487h-a0inarg.png" className={styles.group3} />
      </div>
    </div>
  );
}

export default Component;
