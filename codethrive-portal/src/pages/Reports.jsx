import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/common/Card';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { 
  FileBarChart, Users, CalendarCheck, CheckSquare, 
  Banknote, Download, Filter, Search, PieChart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('employee');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'employee', label: 'Employee Analytics', icon: <Users size={16} /> },
    { id: 'payroll', label: 'Payroll & Costs', icon: <Banknote size={16} /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={16} /> },
    { id: 'task', label: 'Productivity', icon: <CheckSquare size={16} /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileBarChart size={16} /> },
  ];

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        // const res = await api.get(`/reports/summary?type=${activeTab}`);
        
        // Simulating API based on tab
        setTimeout(() => {
          if (activeTab === 'employee') {
            setReportData({
              active: 145,
              pending: 12,
              onLeave: 8,
              departments: [
                { _id: 'Engineering', count: 65 },
                { _id: 'Design', count: 24 },
                { _id: 'Marketing', count: 32 },
                { _id: 'HR', count: 12 },
                { _id: 'Sales', count: 24 }
              ],
              newHiresData: [
                { name: 'Jan', hires: 4 }, { name: 'Feb', hires: 3 }, { name: 'Mar', hires: 7 }, 
                { name: 'Apr', hires: 2 }, { name: 'May', hires: 5 }, { name: 'Jun', hires: 8 }
              ]
            });
          } else if (activeTab === 'payroll') {
            setReportData({
              totalPayout: 4500000,
              avgSalary: 85000,
              byMonth: [
                { _id: 'Jan', total: 420000 }, { _id: 'Feb', total: 425000 }, { _id: 'Mar', total: 430000 },
                { _id: 'Apr', total: 445000 }, { _id: 'May', total: 450000 }, { _id: 'Jun', total: 460000 }
              ]
            });
          } else {
            setReportData(null);
          }
          setLoading(false);
        }, 600);
      } catch (err) {
        console.warn('Failed to fetch report data');
        setReportData(null);
        setLoading(false);
      }
    };
    
    if (activeTab !== 'audit') {
      fetchReportData();
    } else {
      setReportData(null);
    }
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Enterprise Reports</h1>
          <p style={{ color: 'var(--text-muted)' }}>Generate, filter, and export system-wide analytics.</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '1px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', background: 'transparent',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column' }}>
            <div className="loader"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Generating Report...</p>
          </div>
        ) : activeTab === 'employee' && reportData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Employees</p>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: 'var(--success)' }}>{reportData.active}</h3>
              </Card>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pending Onboarding</p>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: 'var(--warning)' }}>{reportData.pending}</h3>
              </Card>
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Currently On Leave</p>
                <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: 'var(--danger)' }}>{reportData.onLeave}</h3>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card title="Headcount by Department">
                <DataTable 
                  columns={[
                    { header: 'Department', accessor: '_id' },
                    { header: 'Headcount', accessor: 'count', render: row => <span style={{ fontWeight: 600 }}>{row.count}</span> }
                  ]} 
                  data={reportData.departments} 
                  searchable={false}
                />
              </Card>
              <Card title="Hiring Trend (Last 6 Months)">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.newHiresData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }} />
                      <Bar dataKey="hires" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        ) : activeTab === 'payroll' && reportData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <Card style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-bg)', borderRadius: '50%', marginBottom: '1rem' }}><Banknote size={32} color="var(--primary-light)" /></div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Total Payout (YTD)</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem' }}>₹{reportData.totalPayout.toLocaleString()}</h2>
              </Card>
              <Card style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}><PieChart size={32} color="var(--success)" /></div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Average Salary</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem' }}>₹{reportData.avgSalary.toLocaleString()}</h2>
              </Card>
            </div>

            <Card title="Monthly Payroll Expense">
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="_id" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={val => `₹${val/1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }} formatter={val => `₹${val.toLocaleString()}`} />
                    <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <FileBarChart size={64} color="var(--text-muted)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Data Available</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Data for {tabs.find(t => t.id === activeTab)?.label} is currently being aggregated or the module is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
