import React, { useState, useEffect, useCallback } from 'react';
import { Container, Navbar, Button, Modal, Form, Row, Col, Card, Nav, Alert } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './styles/App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define categories at the top level
const categories = [
  'Rent',
  'Outside Food',
  'Grocery',
  'Family and Friends',
  'Travel',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Healthcare',
  'Education',
  'Transportation',
  'Insurance',
  'Investments',
  'Personal Care',
  'Home Maintenance',
  'Gifts',
  'Subscriptions',
  'Other'
];

function Signature() {
  return (
    <div className="signature">
      <p className="text-center text-muted">Made by Bugu for Bugi</p>
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState('home');
  const [allExpenses, setAllExpenses] = useState([]);
  const [folders, setFolders] = useState(() => {
    const savedFolders = localStorage.getItem('expenseFolders');
    return savedFolders ? JSON.parse(savedFolders) : [];
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    localStorage.setItem('expenseFolders', JSON.stringify(folders));
  }, [folders]);

  const updateAllExpenses = useCallback((folders) => {
    const expenses = folders.reduce((acc, folder) => {
      return [...acc, ...folder.expenses.map(exp => ({ ...exp, folderName: folder.name }))];
    }, []);
    setAllExpenses(expenses);
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allExpenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'expenses.xlsx');
  };

  const generateShareLink = () => {
    const data = {
      folders: folders,
      expenses: allExpenses
    };
    const encodedData = btoa(JSON.stringify(data));
    const link = `${window.location.origin}${window.location.pathname}?shared=${encodedData}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    });
  };

  useEffect(() => {
    // Check for shared data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    
    if (sharedData) {
      try {
        const decodedData = JSON.parse(atob(sharedData));
        setFolders(decodedData.folders);
        setAllExpenses(decodedData.expenses);
      } catch (error) {
        console.error('Error loading shared data:', error);
      }
    }
  }, []);

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">Monthly Expense Tracker</Navbar.Brand>
          <div className="d-flex">
            <Button variant="outline-light" className="me-2" onClick={generateShareLink}>
              Share
            </Button>
            <Button variant="outline-light" onClick={exportToExcel}>
              Export to Excel
            </Button>
          </div>
        </Container>
      </Navbar>

      {showAlert && (
        <Alert variant="success" className="alert-custom" onClose={() => setShowAlert(false)} dismissible>
          Link copied to clipboard!
        </Alert>
      )}

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share Expense Tracker</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Share this link with your friend to collaborate on expenses:</p>
          <div className="share-link-container">
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              className="form-control mb-2"
            />
            <Button variant="primary" onClick={copyToClipboard}>
              Copy Link
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <div className="main-layout">
        <div className="side-panel">
          <Nav className="flex-column">
            <Nav.Link 
              active={activeView === 'home'} 
              onClick={() => setActiveView('home')}
              className="side-panel-item"
            >
              Home
            </Nav.Link>
            <Nav.Link 
              active={activeView === 'folders'} 
              onClick={() => setActiveView('folders')}
              className="side-panel-item"
            >
              Folders
            </Nav.Link>
            <Nav.Link 
              active={activeView === 'summary'} 
              onClick={() => setActiveView('summary')}
              className="side-panel-item"
            >
              Summary
            </Nav.Link>
          </Nav>
        </div>

        <div className="main-content">
          {activeView === 'home' && (
            <Container>
              <div className="home-header">
                <h2 className="mb-4">Welcome to Monthly Expense Tracker</h2>
                <div className="dashboard-image">
                  <img 
                    src="https://img.freepik.com/free-vector/expenses-concept-illustration_114360-5332.jpg" 
                    alt="Expense Tracker"
                    className="welcome-image"
                  />
                </div>
              </div>
              <Row>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Body>
                      <Card.Title>Recent Expenses</Card.Title>
                      <div className="recent-expenses">
                        {allExpenses.slice(0, 5).map(expense => (
                          <div key={expense.id} className="expense-item">
                            <div className="expense-header">
                              <strong>{expense.title}</strong>
                              <span className="expense-amount">₹{expense.amount}</span>
                            </div>
                            <div className="expense-details">
                              <span className="badge bg-primary">{expense.category}</span>
                              <span className="badge bg-info">{expense.folderName}</span>
                              <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <Card.Title>Quick Summary</Card.Title>
                      <div className="summary-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total Expenses:</span>
                          <span className="stat-value">
                            ₹{allExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Categories:</span>
                          <span className="stat-value">
                            {new Set(allExpenses.map(exp => exp.category)).size}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Folders:</span>
                          <span className="stat-value">
                            {folders.length}
                          </span>
                        </div>
                        <div className="folder-list">
                          <span className="stat-label">Folder Names:</span>
                          <div className="folder-names">
                            {folders.map(folder => (
                              <span key={folder.id} className="badge bg-secondary me-2">
                                {folder.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Signature />
            </Container>
          )}
          {activeView === 'folders' && (
            <>
              <Folders folders={folders} setFolders={setFolders} onUpdateExpenses={updateAllExpenses} />
              <Signature />
            </>
          )}
          {activeView === 'summary' && (
            <>
              <Summary expenses={allExpenses} folders={folders} />
              <Signature />
            </>
          )}
        </div>
      </div>

      <footer className="footer mt-auto py-3 bg-light">
        <Container className="text-center">
          <span className="text-muted">Made by Bugu for Bugi</span>
        </Container>
      </footer>
    </div>
  );
}

function ExpenseForm({ show, handleClose, folderId, onSave }) {
  const [expense, setExpense] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
    tags: []
  });

  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'UPI',
    'Bank Transfer',
    'Digital Wallet'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount),
      timestamp: new Date().toISOString()
    });
    handleClose();
    setExpense({
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: '',
      tags: []
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New Expense</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter expense title"
                  value={expense.title}
                  onChange={(e) => setExpense({...expense, title: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={expense.amount}
                  onChange={(e) => setExpense({...expense, amount: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={expense.category}
                  onChange={(e) => setExpense({...expense, category: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select
                  value={expense.paymentMethod}
                  onChange={(e) => setExpense({...expense, paymentMethod: e.target.value})}
                  required
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={expense.date}
                  onChange={(e) => setExpense({...expense, date: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tags (comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., important, recurring"
                  value={expense.tags.join(', ')}
                  onChange={(e) => setExpense({...expense, tags: e.target.value.split(',').map(tag => tag.trim())})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter description"
              value={expense.description}
              onChange={(e) => setExpense({...expense, description: e.target.value})}
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Expense
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

function Folders({ folders, setFolders, onUpdateExpenses }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    onUpdateExpenses(folders);
  }, [folders, onUpdateExpenses]);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      setFolders([...folders, { id: Date.now(), name: newFolderName, expenses: [] }]);
      setNewFolderName('');
    }
  };

  const handleAddExpense = (folderId) => {
    setSelectedFolderId(folderId);
    setShowExpenseForm(true);
  };

  const handleSaveExpense = (expense) => {
    setFolders(folders.map(folder => {
      if (folder.id === selectedFolderId) {
        return {
          ...folder,
          expenses: [...folder.expenses, expense]
        };
      }
      return folder;
    }));
  };

  const filteredFolders = folders.map(folder => ({
    ...folder,
    expenses: folder.expenses.filter(expense => {
      const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || expense.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
  }));

  return (
    <div className="folders">
      <h2>Your Folders</h2>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <Button variant="primary" className="mt-2" onClick={handleAddFolder}>
          Add Folder
        </Button>
      </div>

      <div className="filters mb-4">
        <Row>
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      <div className="folder-list">
        {filteredFolders.map((folder) => (
          <div key={folder.id} className="card mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{folder.name}</h5>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => handleAddExpense(folder.id)}
                >
                  Add Expense
                </Button>
              </div>
              {folder.expenses.length > 0 && (
                <div className="mt-3">
                  <h6>Expenses:</h6>
                  <div className="expense-list">
                    {folder.expenses.map((expense) => (
                      <div key={expense.id} className="expense-item">
                        <div className="expense-header">
                          <strong>{expense.title}</strong>
                          <span className="expense-amount">₹{expense.amount}</span>
                        </div>
                        <div className="expense-details">
                          <span className="badge bg-primary">{expense.category}</span>
                          <span className="badge bg-secondary">{expense.paymentMethod}</span>
                          <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                        {expense.tags.length > 0 && (
                          <div className="expense-tags">
                            {expense.tags.map((tag, index) => (
                              <span key={index} className="badge bg-info me-1">{tag}</span>
                            ))}
                          </div>
                        )}
                        {expense.description && (
                          <div className="expense-description">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ExpenseForm
        show={showExpenseForm}
        handleClose={() => setShowExpenseForm(false)}
        folderId={selectedFolderId}
        onSave={handleSaveExpense}
      />
    </div>
  );
}

function Summary({ expenses, folders }) {
  const getMonthlyCategoryData = () => {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    const totalExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const chartData = {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: 'Monthly Expenses by Category',
          data: Object.values(categoryTotals),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0'
          ],
          borderColor: '#fff',
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Monthly Category-wise Expenses'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value;
            }
          }
        }
      }
    };

    return { chartData, options, totalExpenses };
  };

  const { chartData, options, totalExpenses } = getMonthlyCategoryData();

  return (
    <Container>
      <h2 className="mb-4">Expense Summary</h2>
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Monthly Total</Card.Title>
              <div className="total-expense">
                <span className="total-label">Total Expenses for {format(new Date(), 'MMMM yyyy')}:</span>
                <span className="total-amount">₹{totalExpenses.toFixed(2)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Monthly Category Summary</Card.Title>
              <div style={{ height: '400px', position: 'relative' }}>
                <Bar data={chartData} options={options} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App; 