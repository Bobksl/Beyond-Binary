# Beyond Binary - UniMate Collaborative Learning Platform

## 0. Problem statement

At NTU, news and information are fragmented. As a result, many students, particularly international students who move to Singapore alone, students who belong to gender or ethnic minorities within their course, and exchange students who may be the only representative from their home university will lack the informal networks and internal connections needed to access important information. This fragmented communication leads to unequal access to news and updates, causing these students to miss timely information and experience reduced inclusion and participation in the university community.

This situation causes students to miss important academic and administrative information, limits their participation in campus activities and support services, and increases social isolation and disengagement. As a result, the university also fails to identify and develop student talents, overlooks potential student leaders and contributors, and misses opportunities to benefit from the skills, perspectives, and initiatives of under-represented students.

## 1. Project Overview

UniMate is a unified digital platform that centralizes and links together student communities, university news and information, and student support resources in one place. The platform uses intelligent algorithms to connect and group students based on shared interests, course of study, and year of study, promoting meaningful interaction across diverse backgrounds. It also serves as a single hub for university announcements, student club and society events, and a curated resources page offering dedicated support for international students of all nationalities.
---

## 2. Theoretical Framework: Parallel Cascade Selection Molecular Dynamics (PaCS-MD)

### Biological Context and Mechanism

The core grouping engine is based on **Parallel Cascade Selection Molecular Dynamics (PaCS-MD)**, an enhanced sampling method originally developed for computational biophysics. In its primary context, PaCS-MD is used to observe rare biological events—such as protein folding or ligand binding—that occur on timescales far beyond the reach of standard molecular simulations.

The method is executed as a "repetition of time leaps in parallel worlds" through a cycle consisting of:

1. **Parallel Sampling:** Multiple independent simulations (replicas) are run simultaneously for short time intervals.
2. **Selection:** The resulting snapshots are ranked based on a specific "selection feature" (a physical metric like distance to a target state).
3. **Branching:** The highest-ranking snapshots are selected to serve as the initial structures for the next cycle.
4. **Velocity Re-initialization:** New random velocities are assigned to the atoms in each replica. This prevents the system from becoming trapped in local energy valleys and forces the exploration of new pathways toward the goal.

---

## 3. Social Application and Team Formation

In the UniMate environment, these biophysical principles are translated into a social optimization engine. Rather than simulating atomic coordinates, the algorithm navigates a high-dimensional attribute space where the "target state" is a maximally cohesive team configuration.

The algorithm generates hundreds of "parallel worlds" representing potential group distributions. The system evaluates the social affinity within these groups based on user profiles. Through successive cycles of selection and "shuffling" (re-initializing the social velocity of unassigned users), the engine rapidly converges on group structures that maximize compatibility. This method effectively discovers high-performance team combinations that would be missed by traditional linear sorting or simple clustering methods.

---

## 4. Perceptron Logic and Weighting Strategy

To evaluate group quality, UniMate employs a perceptron-inspired scoring model that balances interpretability with data-driven adaptation.

### Scoring Baseline

The initial selection feature uses a stable, normalized weight set (6:3:2:1):

* **Interests (6):** The primary driver for intrinsic motivation and shared goals.
* **Major (3):** Foundation for shared academic vocabulary and context.
* **Year of Study (2):** Alignment of current academic pressure and experience level.
* **Personality (1):** Fine-tuning for interpersonal harmony and communication styles.

### Adaptive Tuning

The perceptron monitors group outcomes—such as mission completion rates and engagement metrics—to refine these weights over time.

* **Constant Baseline:** Maintained for governance, stability, and transparency.
* **Controlled Variation:** The system allows for subtle, bounded tuning of weights based on cohort-specific data to discover non-obvious importance shifts.
* **Guardrails:** To ensure fairness, all tuning is subject to hard bounds, periodic reviews, and manual rollback capabilities to the 6:3:2:1 baseline.

---

## 5. Cooperative Reward System

### Objective (SMART)

For each week, every learning team (4–6 students) must complete at least two verified cooperative academic interactions involving at least three distinct members of the team. This directly targets academic cooperation and social connection. 

As for rewards, points will be awarded upon completion of task, these points will be able to translate to real life vouchers and freebies. Fundings for these are discussed in the "commercialization" section below.

### Verification Rules (Strict Progress Criteria)

Only the following actions generate progress toward mission completion:

* **Rule 1: Peer Explanation**
A reward is granted when Student A posts an explanation linked to a course topic, Student B marks the explanation as helpful, and Student B answers a short, automatically generated concept check (1 question). All three conditions must be satisfied.
* **Rule 2: Collaborative Problem Solving**
A reward is granted when at least two students co-edit a problem solution or summary, each contributor submits at least one distinct edit, and a third team member validates the final version.
* **Rule 3: Live or Asynchronous Study Session**
A reward is granted when at least three members join the same scheduled session (online or offline) and each member submits a short post-session reflection (one structured question).

### Anti-Gaming Constraint

A team cannot earn more than one reward per member from the same interaction type in the same week. This enforces variety and broader participation.
---

## 6. Technical Implementation

### User Flow

1. **Start:** Sign in with course/institution credentials.
2. **Onboarding:** Complete quick profile (availability, study style, interests).
3. **Placement:** Automatically placed into a small learning team via the PaCS engine.
4. **Engagement:** View the weekly cooperative mission and create required activities.
5. **Validation:** Complete role-based steps (contribute, receive help, validate).
6. **Verification:** System verifies interaction automatically; team progress and new tools are unlocked.

### Setup Instructions

1. **Install Dependencies:** `npm install`
2. **Environment Configuration:** Configure `src/api/client.js` with your `supabaseUrl` and `supabaseKey`.
3. **Run Application:** `npm run dev`

### Database Schema

* `profiles`: Extended user information and attributes for PaCS-MD selection.
* `teams`: Team groupings and metadata.
* `interactions`: Records for the three types of collaborative activities.
* `contributions/validations`: Records individual participation and verification logs.
* `missions/progress_tracks`: Tracks weekly objectives and team-level unlocks.


## 7. Commercialization
The page for individual and club promotion has the ability to be monetized in the future. Our AI algorithms can push these paid ads onto everyones promotional page. CLubs or even individuals can pay to get their promotions prioritized

---

## 8. Scalability
This page will start off being used for NTU students. We strongly believe in its potential to be scaled to be used in other universities, such as NUS and SMU, which has a very similar operation structure to NTU. Further on, it can even be developed for universities abroad. 

---

## 8. References (for algorithm)

Ikizawa, S., Hori, T., Wijaya, T. N., Kono, H., Bai, Z., Kimizono, T., Lu, W., Tran, D. P., & Kitao, A. (2024). PaCS-Toolkit: Optimized Software Utilities for Parallel Cascade Selection Molecular Dynamics (PaCS-MD) Simulations and Subsequent Analyses. *The Journal of Physical Chemistry B*, 128(15), 3631–3642. [https://doi.org/10.1021/acs.jpcb.4c01271](https://doi.org/10.1021/acs.jpcb.4c01271)

---

## License

This project is licensed under the MIT License.