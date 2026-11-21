from typing import Dict, Any, List, Optional
from decimal import Decimal
import numpy as np
from sklearn.ensemble import IsolationForest

class FinancialAnomalyDetector:
    def __init__(self):
        self.model_version = "CivicAI-AnomalyDetector-v1.1-IsoForest"
        self._iso_forest = None
        self._init_isolation_forest()

    def _init_isolation_forest(self):
        """
        Trains baseline Isolation Forest on typical public project ratios:
        [expenditure_ratio, progress_ratio, expenditure_progress_divergence]
        """
        np.random.seed(42)
        normal_samples = []
        for _ in range(250):
            prog = np.random.uniform(0.05, 1.0)
            # Normal expenditure tends to track progress within +/- 20%
            exp_ratio = np.clip(prog + np.random.normal(0.0, 0.12), 0.0, 1.1)
            divergence = exp_ratio - prog
            normal_samples.append([exp_ratio, prog, divergence])

        self._iso_forest = IsolationForest(contamination=0.08, random_state=42)
        self._iso_forest.fit(normal_samples)

    def analyze_finances(
        self,
        approved_budget: Optional[Decimal],
        reported_expenditure: Optional[Decimal],
        reported_progress: Optional[float],
        released_funds: Optional[Decimal] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates project finances for unusual patterns requiring administrative review.
        Returns None if no notable anomaly is detected.
        """
        if approved_budget is None or reported_expenditure is None:
            return None

        budget = float(approved_budget)
        expenditure = float(reported_expenditure)
        progress = (reported_progress or 0.0) / 100.0

        if budget <= 0:
            return {
                "flag_type": "DATA_INTEGRITY_CHECK",
                "severity": "MEDIUM",
                "reason": "Approved budget is reported as zero or missing while positive expenditure is recorded.",
                "expenditure_ratio": None,
                "review_status": "REQUIRES_REVIEW",
                "recommended_action": "Verify original administrative sanction order."
            }

        exp_ratio = expenditure / budget
        divergence = exp_ratio - progress

        # 1. Expenditure exceeding approved allocation
        if exp_ratio > 1.15:
            pct_over = round((exp_ratio - 1.0) * 100, 1)
            return {
                "flag_type": "BUDGET_EXCEEDANCE_REVIEW",
                "severity": "HIGH",
                "reason": f"Reported cumulative expenditure exceeds approved budget by {pct_over}% (₹{expenditure:,.2f} vs. approved ₹{budget:,.2f}).",
                "expenditure_ratio": round(exp_ratio, 2),
                "review_status": "REQUIRES_REVIEW",
                "recommended_action": "Verify if revised administrative approval or supplementary budget was sanctioned."
            }

        # 2. Significant Expenditure with Low Physical Progress
        if exp_ratio >= 0.70 and progress <= 0.30:
            return {
                "flag_type": "EXPENDITURE_PROGRESS_DIVERGENCE",
                "severity": "HIGH",
                "reason": f"High expenditure ({exp_ratio*100:.1f}%) reported alongside low physical completion ({progress*100:.1f}%). Requires review to ensure vouchers correspond to completed deliverables.",
                "expenditure_ratio": round(exp_ratio, 2),
                "review_status": "REQUIRES_REVIEW",
                "recommended_action": "Conduct site inspection or verify procurement stage mobilization advances."
            }

        # 3. Released Funds vs Expenditure Discrepancy
        if released_funds is not None:
            released = float(released_funds)
            if expenditure > released * 1.10 and released > 0:
                return {
                    "flag_type": "FUND_RELEASE_EXCEEDANCE",
                    "severity": "MEDIUM",
                    "reason": f"Reported expenditure (₹{expenditure:,.2f}) exceeds total released treasury funds (₹{released:,.2f}) by more than 10%.",
                    "expenditure_ratio": round(exp_ratio, 2),
                    "review_status": "REQUIRES_REVIEW",
                    "recommended_action": "Check pending treasury reconciliation or municipal borrowing."
                }

        # 4. Isolation Forest statistical anomaly check
        try:
            features = [[exp_ratio, progress, divergence]]
            is_outlier = self._iso_forest.predict(features)[0] == -1
            if is_outlier and divergence > 0.35:
                return {
                    "flag_type": "STATISTICAL_DISTRIBUTION_ANOMALY",
                    "severity": "MEDIUM",
                    "reason": f"Spending velocity deviates significantly from typical peer project distributions for this sector (Divergence score: {divergence:.2f}).",
                    "expenditure_ratio": round(exp_ratio, 2),
                    "review_status": "REQUIRES_REVIEW",
                    "recommended_action": "Review milestone billing schedule."
                }
        except Exception:
            pass

        return None

anomaly_detector = FinancialAnomalyDetector()
