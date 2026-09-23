# Tests Directory

This directory contains automated unit and API integration tests for the Support Ticket Management System.

Tests will be implemented using Jest / Supertest covering:
- Authentication flow (registration, login, invalid credentials)
- Authorization and role-based access control (RBAC)
- Ticket CRUD operations
- Customer data isolation (access prevention across customer tenants)
- Error handling and payload validation
