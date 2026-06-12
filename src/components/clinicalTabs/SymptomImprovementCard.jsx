import React from 'react';

const SymptomImprovementCard = ({ symptoms = [], theme ,style}) => {
  // --- INTERNAL STYLES LAYER ---
  const styles = {
    card: { 
      background: theme.white, 
      borderRadius: theme.radius || '12px', 
      padding: '22px', 
      boxShadow: theme.shadowSm || '0 1px 3px rgba(15,76,92,0.08)', 
      border: `1px solid rgba(15,76,92,0.06)`, 
      boxSizing: 'border-box' 
    },
    cardTitle: { 
      fontFamily: "'Playfair Display', serif", 
      fontSize: '15px', 
      fontWeight: 600, 
      color: theme.charcoal, 
      marginBottom: '14px' 
    },
    table: { 
      width: '100%', 
      borderCollapse: 'collapse', 
      minWidth: '280px' 
    },
    th: { 
      fontSize: '10px', 
      fontWeight: 700, 
      letterSpacing: '0.06em', 
      textTransform: 'uppercase', 
      color: theme.grey, 
      padding: '6px 4px', 
      textAlign: 'center', 
      borderBottom: `1px solid ${theme.ivoryDark || '#EDE7DB'}` 
    },
    thLeft: { 
      fontSize: '10px', 
      fontWeight: 700, 
      letterSpacing: '0.06em', 
      textTransform: 'uppercase', 
      color: theme.grey, 
      padding: '6px 4px', 
      textAlign: 'left', 
      borderBottom: `1px solid ${theme.ivoryDark || '#EDE7DB'}` 
    },
    td: { 
      padding: '9px 4px', 
      fontSize: '12px', 
      borderBottom: `1px solid ${theme.ivory || '#F7F1E8'}` 
    },
    tdCenter: { 
      padding: '9px 4px', 
      fontSize: '12px', 
      textAlign: 'center', 
      borderBottom: `1px solid ${theme.ivory || '#F7F1E8'}` 
    }
  };

  return (
    <div style={styles.card} className="responsive-table-card">
      <div style={styles.cardTitle}>Symptom Improvement</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thLeft}>Symptom</th>
              <th style={styles.th}>Base</th>
              <th style={styles.th}>Now</th>
              <th style={styles.th}>Change</th>
            </tr>
          </thead>
          <tbody>
            {symptoms.map((row, index) => {
              // Calculate the change dynamically in frontend view state
              const changeValue = row.now - row.base; 
              
              let color = theme.green;
              let arrow = '↓';

              if (changeValue >= 0) {
                color = theme.red;
                arrow = '↑';
              } else if (changeValue > -60) {
                // Drop is suboptimal (didn't reach -60 improvement target line)
                color = theme.amber;
                arrow = '↓';
              } else {
                // Drop is highly optimal (dropped down past -60 target)
                color = theme.green;
                arrow = '↓';
              }

              return (
                <tr key={index} style={{ background: index % 2 === 1 ? theme.ivory : 'transparent' }}>
                  <td style={styles.td}>{row.symptom}</td>
                  <td style={styles.tdCenter}>{row.base}%</td>
                  <td style={styles.tdCenter}>{row.now}%</td>
                  <td style={styles.tdCenter}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: color }}>
                      {arrow} {Math.abs(changeValue)}pp
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SymptomImprovementCard;