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
                              <span className="expense-amount">{expense.amount.toFixed(2)}</span>
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
                            {allExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
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

function Folders({ folders, setFolders, onUpdateExpenses }) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now(),
        name: newFolderName,
        expenses: []
      };
      setFolders([...folders, newFolder]);
      setNewFolderName('');
    }
  };

  const handleRenameFolder = (folderId) => {
    if (editingFolderName.trim()) {
      const updatedFolders = folders.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, name: editingFolderName };
        }
        return folder;
      });
      setFolders(updatedFolders);
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const handleDeleteFolder = (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder? All expenses in this folder will be deleted.')) {
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      setFolders(updatedFolders);
      onUpdateExpenses(updatedFolders);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setSelectedFolderId(expense.folderId);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = (folderId, expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedFolders = folders.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            expenses: folder.expenses.filter(exp => exp.id !== expenseId)
          };
        }
        return folder;
      });
      setFolders(updatedFolders);
      onUpdateExpenses(updatedFolders);
    }
  };

  const handleAddExpense = (folderId) => {
    setSelectedFolderId(folderId);
    setEditingExpenseId(null);
    setShowExpenseForm(true);
  };

  const handleSaveExpense = (expense) => {
    const updatedFolders = folders.map(folder => {
      if (folder.id === expense.folderId) {
        if (editingExpenseId) {
          // Update existing expense
          return {
            ...folder,
            expenses: folder.expenses.map(exp => 
              exp.id === editingExpenseId ? { ...expense, id: editingExpenseId } : exp
            )
          };
        } else {
          // Add new expense
          return {
            ...folder,
            expenses: [...folder.expenses, expense]
          };
        }
      }
      return folder;
    });
    setFolders(updatedFolders);
    onUpdateExpenses(updatedFolders);
    setShowExpenseForm(false);
    setEditingExpenseId(null);
  };

  return (
    <Container>
      <h2 className="mb-4">Myhna Heights</h2>
      <div className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>New Folder Name</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
            />
            <Button variant="primary" onClick={handleAddFolder} className="ms-2">
              <i className="bi bi-plus-lg"></i> Add Folder
            </Button>
          </div>
        </Form.Group>
      </div>
      <Row>
        {folders.map((folder) => (
          <Col key={folder.id} md={6} lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  {editingFolderId === folder.id ? (
                    <div className="d-flex w-100">
                      <Form.Control
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        className="me-2"
                      />
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleRenameFolder(folder.id)}
                        className="me-1"
                      >
                        <i className="bi bi-check-lg"></i>
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setEditingFolderId(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Card.Title className="mb-0">{folder.name}</Card.Title>
                      <div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setEditingFolderName(folder.name);
                          }}
                          className="me-1"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteFolder(folder.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={() => handleAddExpense(folder.id)}
                  className="mb-3"
                >
                  <i className="bi bi-plus-lg"></i> Add Expense
                </Button>
                <div className="expense-list">
                  {folder.expenses.map((expense) => (
                    <div key={expense.id} className="expense-item">
                      <div className="expense-header">
                        <strong>{expense.title}</strong>
                        <div className="expense-actions">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                            className="text-primary"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleDeleteExpense(folder.id, expense.id)}
                            className="text-danger"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <div className="expense-details">
                        <span className="expense-amount">{expense.amount.toFixed(2)}</span>
                        <span className="badge bg-primary">{expense.category}</span>
                        <span className="expense-date">{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <ExpenseForm
        show={showExpenseForm}
        handleClose={() => {
          setShowExpenseForm(false);
          setEditingExpenseId(null);
        }}
        folderId={selectedFolderId}
        onSave={handleSaveExpense}
        editingExpense={editingExpenseId ? folders
          .find(f => f.expenses.some(e => e.id === editingExpenseId))
          ?.expenses.find(e => e.id === editingExpenseId) : null}
      />
    </Container>
  );
}

function ExpenseForm({ show, handleClose, folderId, onSave, editingExpense }) {
  const [title, setTitle] = useState(editingExpense?.title || '');
  const [amount, setAmount] = useState(editingExpense?.amount || '');
  const [category, setCategory] = useState(editingExpense?.category || '');
  const [date, setDate] = useState(editingExpense?.date || format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
    } else {
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [editingExpense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const expense = {
      id: editingExpense?.id || Date.now(),
      title,
      amount: parseFloat(amount),
      category,
      date,
      folderId
    };
    onSave(expense);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            {editingExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
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

    const categoryTotals = {};
    categories.forEach(category => {
      categoryTotals[category] = 0;
    });

    monthlyExpenses.forEach(expense => {
      if (categoryTotals.hasOwnProperty(expense.category)) {
        categoryTotals[expense.category] += expense.amount;
      }
    });

    return {
      labels: categories,
      datasets: [
        {
          label: 'Monthly Expenses by Category',
          data: categories.map(category => categoryTotals[category]),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 102, 255, 0.6)',
            'rgba(255, 102, 102, 0.6)',
            'rgba(102, 255, 102, 0.6)',
            'rgba(255, 102, 255, 0.6)',
            'rgba(102, 255, 255, 0.6)',
            'rgba(255, 255, 102, 0.6)',
            'rgba(102, 102, 255, 0.6)',
            'rgba(255, 102, 102, 0.6)',
            'rgba(102, 255, 102, 0.6)',
            'rgba(255, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(40, 102, 255, 1)',
            'rgba(255, 102, 102, 1)',
            'rgba(102, 255, 102, 1)',
            'rgba(255, 102, 255, 1)',
            'rgba(102, 255, 255, 1)',
            'rgba(255, 255, 102, 1)',
            'rgba(102, 102, 255, 1)',
            'rgba(255, 102, 102, 1)',
            'rgba(102, 255, 102, 1)',
            'rgba(255, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Expenses by Category'
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

  return (
    <Container>
      <h2 className="mb-4">Monthly Summary</h2>
      <div className="chart-container" style={{ height: '400px', marginBottom: '20px' }}>
        <Bar data={getMonthlyCategoryData()} options={chartOptions} />
      </div>
    </Container>
  );
}

export default App; 