# Git and GitHub as Version Control System and Code Hosting Platform

## Context and Problem Statement

The Benjrm project requires a version control system to manage source code and enable collaboration within the development team. 
In addition, a code hosting platform is needed to support collaboration workflows and continuous integration and deployment (CI/CD) capabilities.

The challenge is to select a suitable version control and code hosting platform that supports efficient collaboration, reliable CI/CD integration, and long-term maintainability. The decision must also consider team familiarity with the platform, availability of CI/CD infrastructure, and potential migration effort after the project lifecycle.

## Considered Options

* GitLab(THM)
* GitLab
* GitHub

## Decision Outcome

Chosen option: "GitHub", because of long-term maintainability and existing experience.

GitHub was selected over the university-hosted GitLab solution due to previous reliability and usability issues experienced with the university GitLab instance and limited availability of shared runners. In many cases, setting up and maintaining self-hosted runners introduced additional complexity and overhead.

In contrast, GitHub provides a stable and widely adopted platform with a strong CI/CD ecosystem through GitHub Actions. The availability of a large marketplace for prebuilt actions significantly reduces setup effort and improves development efficiency.

Another important factor is team familiarity. All team members already have GitHub accounts and prior experience using the platform, which ensures smooth onboarding and effective collaboration from the start. In comparison, GitLab would require initial setup and familiarization for all team members, as none currently have active GitLab experience.

Finally, GitHub supports long-term maintainability of the project. Since the project may continue or be developed further after the university context, using GitHub avoids the need for a migration to another platform and aligns with industry standards.
