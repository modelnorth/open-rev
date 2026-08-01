# Contributing to OpenRev

Thank you for your interest in contributing to OpenRev!

---

## Development Setup

```bash
git clone https://github.com/openrev/openrev.git
cd openrev
npm install
npm test
```

---

## Architectural Changes & RFC Process

Core platform contracts, capability specifications, and artifact schemas are frozen in `ARCHITECTURE_FREEZE.md`. Any proposed breaking change or architectural addition must be submitted as an RFC under `docs/rfcs/000N-feature-name.md` prior to code implementation.

---

## Submitting Pull Requests

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`).
2. Ensure tests pass (`npm test`).
3. Commit clean, atomic commits with clear descriptions.
4. Open a Pull Request referencing related issues.
