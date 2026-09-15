import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import './common.css';

const DataTable = ({ columns, data, searchable = true, itemsPerPage = 10, className = '', tableLayout = 'auto' }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className={`ct-table-wrapper ${className}`}>
      {searchable && (
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(15, 23, 42, 0.3)' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '2.4rem', paddingRight: '1rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', width: '100%', fontSize: '0.82rem', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
      
      <div className="ct-table-container">
        <table className="ct-table" style={{ tableLayout: tableLayout }}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} style={col.width ? { width: col.width } : {}}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? currentData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={col.width ? { width: col.width } : {}}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ct-pagination">
          <div className="ct-pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="ct-pagination-controls">
            <button className="ct-page-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
              <ChevronLeft size={16} />
            </button>
            {/* Simple page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show a window of pages around current page
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                 pageNum = currentPage - 3 + i + 1;
                 if (pageNum > totalPages) return null;
              }
              return (
                <button 
                  key={pageNum}
                  className={`ct-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            <button className="ct-page-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
