#!/usr/bin/env python3
"""Test runner script for the PromptLens API."""

import subprocess
import sys
import os
import argparse

def show_help():
    """Show available test options."""
    print("🧪 PromptLens API Test Suite")
    print("=" * 40)

    test_commands = [
        {
            "name": "All Tests (default)",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/", "-v"],
            "description": "Run all test files with verbose output"
        },
        {
            "name": "API Endpoint Tests",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/test_generate_endpoint.py", "-v"],
            "description": "Run API endpoint tests only"
        },
        {
            "name": "Database Tests",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/test_database.py", "-v", "-s"],
            "description": "Run database service tests only"
        },
        {
            "name": "Embedding Tests",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/test_embedding.py", "-v", "-s"],
            "description": "Run embedding service tests only"
        },
        {
            "name": "Coverage Report",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/", "--cov=.", "--cov-report=term-missing"],
            "description": "Run all tests with coverage analysis"
        },
        {
            "name": "Quick Test",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/", "-x", "-q"],
            "description": "Run all tests and stop on first failure"
        },
        {
            "name": "Real API Integration",
            "cmd": ["uv", "run", "python", "-m", "pytest", "test_files/test_generate_endpoint.py::TestGenerateEndpoint::test_real_openai_integration", "-v", "-s"],
            "description": "Run only the real API integration test"
        }
    ]

    print("Available options:")
    print("  (no args)       Run all tests")
    print("  -h, --help      Show this help message")
    print("  --api           Run API endpoint tests only")
    print("  --db            Run database tests only")
    print("  --embedding     Run embedding tests only")
    print("  --coverage      Run all tests with coverage")
    print("  --quick         Run tests and stop on first failure")
    print("  --integration   Run only real API integration test")

    print("\nManual commands:")
    print("• All Tests: uv run python -m pytest test_files/ -v")
    print("• API Endpoint: uv run python -m pytest test_files/test_generate_endpoint.py -v")
    print("• Database: uv run python -m pytest test_files/test_database.py -v -s")
    print("• Embeddings: uv run python -m pytest test_files/test_embedding.py -v -s")

    print("\n✅ Test suite is ready!")
    print("📁 Test files location: test_files/")
    print("📊 Coverage reports will be in: htmlcov/")

def run_tests(test_type="all"):
    """Run the specified test suite."""

    # Change to the API directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print("🧪 PromptLens API Test Suite")
    print("=" * 40)

    # Define test commands
    commands = {
        "all": ["uv", "run", "python", "-m", "pytest", "test_files/", "-v"],
        "api": ["uv", "run", "python", "-m", "pytest", "test_files/test_generate_endpoint.py", "-v"],
        "db": ["uv", "run", "python", "-m", "pytest", "test_files/test_database.py", "-v", "-s"],
        "embedding": ["uv", "run", "python", "-m", "pytest", "test_files/test_embedding.py", "-v", "-s"],
        "coverage": ["uv", "run", "python", "-m", "pytest", "test_files/", "--cov=.", "--cov-report=term-missing"],
        "quick": ["uv", "run", "python", "-m", "pytest", "test_files/", "-x", "-q"],
        "integration": ["uv", "run", "python", "-m", "pytest", "test_files/test_generate_endpoint.py::TestGenerateEndpoint::test_real_openai_integration", "-v", "-s"]
    }

    if test_type not in commands:
        print(f"❌ Unknown test type: {test_type}")
        show_help()
        return

    cmd = commands[test_type]
    print(f"Running: {' '.join(cmd)}")
    print()

    # Run the test command
    try:
        result = subprocess.run(cmd, check=False)
        if result.returncode == 0:
            print(f"\n✅ {test_type.title()} tests completed successfully!")
        else:
            print(f"\n❌ {test_type.title()} tests failed with exit code {result.returncode}")
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return 1

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="PromptLens API Test Runner", add_help=False)
    parser.add_argument("-h", "--help", action="store_true", help="Show help message")
    parser.add_argument("--api", action="store_true", help="Run API endpoint tests only")
    parser.add_argument("--db", action="store_true", help="Run database tests only")
    parser.add_argument("--embedding", action="store_true", help="Run embedding tests only")
    parser.add_argument("--coverage", action="store_true", help="Run all tests with coverage")
    parser.add_argument("--quick", action="store_true", help="Run tests and stop on first failure")
    parser.add_argument("--integration", action="store_true", help="Run only real API integration test")

    args = parser.parse_args()

    # Show help
    if args.help:
        show_help()
        return

    # Determine which test to run
    if args.api:
        run_tests("api")
    elif args.db:
        run_tests("db")
    elif args.embedding:
        run_tests("embedding")
    elif args.coverage:
        run_tests("coverage")
    elif args.quick:
        run_tests("quick")
    elif args.integration:
        run_tests("integration")
    else:
        # Default: run all tests
        run_tests("all")

if __name__ == "__main__":
    main()
