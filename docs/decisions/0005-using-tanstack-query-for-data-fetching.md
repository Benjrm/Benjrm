# Using TanStack Query for Data Fetching.

## Context and Problem Statement

Most of the data in Benjrm's frontend comes from the backend API.
Fetching this data manually leads to a lot of repetitive code for handling loading spinners, error messages, and caching. 
The challenge is to find a suitable library to handle these kind of tasks.

## Considered Options

* Manual Fetching
* TanStack Query

## Decision Outcome

Chosen option: "TanStack Query", because it drastically reduces the amount of code we need to write for data fetching and solves complex problems like caching and loading states automatically.
