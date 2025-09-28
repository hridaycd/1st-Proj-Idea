#!/usr/bin/env python3
"""
Booking Management System Setup Script
This script helps set up the development environment for the booking management system.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, cwd=None, check=True):
    """Run a shell command and return the result."""
    print(f"Running: {command}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_requirements():
    """Check if required tools are installed."""
    print("🔍 Checking requirements...")
    
    requirements = {
        'python': 'python3 --version',
        'node': 'node --version',
        'npm': 'npm --version',
        'docker': 'docker --version',
        'docker-compose': 'docker-compose --version'
    }
    
    missing = []
    for tool, command in requirements.items():
        result = run_command(command, check=False)
        if result.returncode != 0:
            missing.append(tool)
        else:
            print(f"✅ {tool} is installed")
    
    if missing:
        print(f"❌ Missing requirements: {', '.join(missing)}")
        print("Please install the missing tools before continuing.")
        sys.exit(1)
    
    print("✅ All requirements are satisfied!")

def setup_backend():
    """Set up the backend environment."""
    print("\n🐍 Setting up backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Create virtual environment
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("Creating Python virtual environment...")
        run_command("python3 -m venv venv", cwd=backend_dir)
    
    # Install dependencies
    print("Installing Python dependencies...")
    if os.name == 'nt':  # Windows
        pip_cmd = str(venv_dir / "Scripts" / "pip")
    else:  # Unix/Linux/macOS
        pip_cmd = str(venv_dir / "bin" / "pip")
    
    run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_dir)
    
    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("Creating .env file...")
        shutil.copy("env.example", env_file)
        print("⚠️  Please edit backend/.env with your configuration")
    
    print("✅ Backend setup complete!")
    return True

def setup_frontend():
    """Set up the frontend environment."""
    print("\n⚛️  Setting up frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    # Install dependencies
    print("Installing Node.js dependencies...")
    run_command("npm install", cwd=frontend_dir)
    
    print("✅ Frontend setup complete!")
    return True

def setup_database():
    """Set up the database."""
    print("\n🗄️  Setting up database...")
    
    # Check if PostgreSQL is running
    result = run_command("pg_isready", check=False)
    if result.returncode != 0:
        print("⚠️  PostgreSQL is not running. Please start PostgreSQL before continuing.")
        print("You can also use Docker to run the database:")
        print("docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15")
        return False
    
    print("✅ Database setup complete!")
    return True

def create_directories():
    """Create necessary directories."""
    print("\n📁 Creating directories...")
    
    directories = [
        "logs",
        "uploads",
        "data"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def main():
    """Main setup function."""
    print("🚀 Booking Management System Setup")
    print("=" * 50)
    
    # Check requirements
    check_requirements()
    
    # Create directories
    create_directories()
    
    # Setup backend
    if not setup_backend():
        print("❌ Backend setup failed!")
        sys.exit(1)
    
    # Setup frontend
    if not setup_frontend():
        print("❌ Frontend setup failed!")
        sys.exit(1)
    
    # Setup database
    setup_database()
    
    print("\n🎉 Setup complete!")
    print("\n📋 Next steps:")
    print("1. Edit backend/.env with your configuration")
    print("2. Start the database (PostgreSQL)")
    print("3. Run database migrations:")
    print("   cd backend && source venv/bin/activate && alembic upgrade head")
    print("4. Start the backend:")
    print("   cd backend && source venv/bin/activate && uvicorn main:app --reload")
    print("5. Start the frontend:")
    print("   cd frontend && npm start")
    print("\nOr use Docker:")
    print("   docker-compose up -d")
    print("\n🌐 Access the application:")
    print("   Frontend: http://localhost:3000")
    print("   Backend:  http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
