// Mock Authentication Backend Config
// In a real application, this would be an API call verifying against a database.

export const MOCK_ADMIN_USER = {
  username: 'Admin',
  password: 'Admin123',
  role: 'admin'
};

export const MOCK_EMPLOYEE_USER = {
  username: 'Employee',
  password: 'Employee123',
  role: 'employee'
};

export const validateLogin = (username, password, role) => {
  if (role === 'admin') {
    if (username !== MOCK_ADMIN_USER.username) {
      return { success: false, error: 'user_not_found' };
    }
    if (password !== MOCK_ADMIN_USER.password) {
      return { success: false, error: 'incorrect_password' };
    }
    return { success: true };
  }
  
  if (role === 'employee') {
    // Check against mock default employee
    if (username === MOCK_EMPLOYEE_USER.username) {
      if (password === MOCK_EMPLOYEE_USER.password) {
        return { success: true };
      }
      return { success: false, error: 'incorrect_password' };
    }

    // Check against registered employees in localStorage
    const storedEmployees = JSON.parse(localStorage.getItem('registered_employees') || '[]');
    const foundEmployee = storedEmployees.find(emp => 
      (emp.email === username || emp.fullName === username || emp.employeeId === username)
    );
    
    if (!foundEmployee) {
      return { success: false, error: 'user_not_found' };
    }
    
    // Hash the plain text password from the form to compare with stored hash
    const hashedInput = btoa(password);
    if (foundEmployee.password !== hashedInput) {
      return { success: false, error: 'incorrect_password' };
    }
    
    return { success: true };
  }

  return { success: false, error: 'user_not_found' };
};
