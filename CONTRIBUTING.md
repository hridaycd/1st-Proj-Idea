# Contributing to Booking Management System

Thank you for your interest in contributing to the Booking Management System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional but recommended)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/booking-management-system.git
   cd booking-management-system
   ```

2. **Quick Setup with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Manual Setup**
   ```bash
   # Run automated setup
   python3 setup.py
   
   # Or setup manually
   # Backend
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for functions and classes
- Use meaningful variable and function names

#### JavaScript/React (Frontend)
- Follow ESLint configuration
- Use functional components with hooks
- Use TypeScript for new components (if applicable)
- Follow React best practices

### Git Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new booking feature"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add real-time booking notifications
fix: resolve payment verification issue
docs: update API documentation
test: add unit tests for booking service
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📝 Documentation

### API Documentation
- API documentation is auto-generated using FastAPI
- Access at: http://localhost:8000/docs
- Update docstrings in route handlers

### Code Documentation
- Use docstrings for functions and classes
- Add inline comments for complex logic
- Update README.md for major changes

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Python/Node.js versions
   - Browser (for frontend issues)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior

3. **Additional Context**
   - Screenshots if applicable
   - Error logs
   - Related issues

## ✨ Feature Requests

When requesting features:

1. **Check Existing Issues**
   - Search for similar requests
   - Comment on existing issues if relevant

2. **Provide Context**
   - Use case and motivation
   - Potential implementation approach
   - Impact on existing functionality

## 🔧 Development Tools

### Recommended VS Code Extensions
- Python
- Pylance
- ESLint
- Prettier
- GitLens
- Docker

### Code Quality Tools
- **Backend**: Black, isort, flake8, mypy
- **Frontend**: ESLint, Prettier, Husky

## 🏗️ Architecture Guidelines

### Backend Architecture
- Follow FastAPI best practices
- Use dependency injection
- Implement proper error handling
- Use async/await for I/O operations

### Frontend Architecture
- Use React hooks and functional components
- Implement proper state management
- Use React Query for server state
- Follow component composition patterns

### Database Guidelines
- Use migrations for schema changes
- Add proper indexes for performance
- Use transactions for data consistency
- Follow naming conventions

## 🚀 Deployment

### Environment Variables
- Never commit sensitive data
- Use `.env.example` as template
- Document all required variables

### Docker
- Keep Dockerfiles optimized
- Use multi-stage builds when appropriate
- Pin base image versions

## 📞 Getting Help

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Create issues for bugs and feature requests
- **Discord**: Join our community Discord (if available)

## 🎯 Areas for Contribution

### High Priority
- [ ] Add comprehensive test coverage
- [ ] Implement CI/CD pipeline
- [ ] Add monitoring and logging
- [ ] Performance optimization
- [ ] Security enhancements

### Medium Priority
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Blockchain integration

### Low Priority
- [ ] UI/UX improvements
- [ ] Documentation updates
- [ ] Code refactoring
- [ ] Performance monitoring

## 📋 Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Update documentation**
6. **Run tests and ensure they pass**
7. **Submit a pull request**

### PR Requirements
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Clear description of changes

### Review Process
- All PRs require review
- Address feedback promptly
- Keep PRs focused and small
- Update PR description if needed

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Booking Management System! 🎉
