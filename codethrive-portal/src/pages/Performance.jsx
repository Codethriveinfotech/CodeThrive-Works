import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { 
  Target, TrendingUp, Award, CheckCircle2, AlertCircle, 
  ChevronUp, ChevronDown, Star
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './Modules.css';

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    // Simulating API fetch
    setTimeout(() => {
      setPerformanceData({
        overallRating: 4.5,
        reviewPeriod: 'Q3 2026',
        reviewer: 'Sarah Manager',
        radarData: [
          { subject: 'Code Quality', A: 90, fullMark: 100 },
          { subject: 'Communication', A: 85, fullMark: 100 },
          { subject: 'Teamwork', A: 95, fullMark: 100 },
          { subject: 'Problem Solving', A: 88, fullMark: 100 },
          { subject: 'On-time Delivery', A: 92, fullMark: 100 },
          { subject: 'Leadership', A: 75, fullMark: 100 }
        ],
        trendData: [
          { name: 'Jan', rating: 4.1 }, { name: 'Feb', rating: 4.2 }, { name: 'Mar', rating: 4.1 },
          { name: 'Apr', rating: 4.3 }, { name: 'May', rating: 4.4 }, { name: 'Jun', rating: 4.5 }
        ],
        goals: [
          { id: 1, title: 'Complete React Native Certification', progress: 100, status: 'Completed' },
          { id: 2, title: 'Reduce Bug Rate by 15%', progress: 85, status: 'On Track' },
          { id: 3, title: 'Mentor 2 Junior Developers', progress: 50, status: 'At Risk' }
        ]
      });
      setLoading(false);
    }, 600);
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={20} fill="var(--warning)" color="var(--warning)" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={20} fill="var(--warning)" color="var(--warning)" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} size={20} color="var(--border-color)" />);
    }
    
    return <div style={{ display: 'flex', gap: '4px' }}>{stars}</div>;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
      <div className="loader"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Performance Data...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Performance Module</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track KPIs, goals, and review feedback.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Overall Rating Card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '1rem' }}>Overall Rating ({performanceData.reviewPeriod})</h3>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'conic-gradient(var(--success) 0%, var(--success) 90%, rgba(255,255,255,0.1) 90%, rgba(255,255,255,0.1) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative'
            }}>
              <div style={{ width: '105px', height: '105px', borderRadius: '50%', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{performanceData.overallRating}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>out of 5</span>
              </div>
            </div>
            {renderStars(performanceData.overallRating)}
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Reviewed by: <strong>{performanceData.reviewer}</strong></p>
          </div>
        </Card>

        {/* Skills Radar */}
        <Card title="Skill Competencies">
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData.radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trend Line */}
        <Card title="Performance Trend">
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData.trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[0, 5]} stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                <Line type="monotone" dataKey="rating" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card title="Key Objectives & Results (OKRs)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {performanceData.goals.map(goal => (
              <div key={goal.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{goal.title}</span>
                  <span style={{ 
                    fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px',
                    background: goal.status === 'Completed' ? 'var(--success-bg)' : goal.status === 'On Track' ? 'var(--primary-bg)' : 'var(--danger-bg)',
                    color: goal.status === 'Completed' ? 'var(--success)' : goal.status === 'On Track' ? 'var(--primary-light)' : 'var(--danger)'
                  }}>
                    {goal.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--glass-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: `${goal.progress}%`, 
                      background: goal.progress === 100 ? 'var(--success)' : goal.progress > 50 ? 'var(--primary)' : 'var(--warning)',
                      borderRadius: '3px'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minWidth: '40px' }}>{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Feedback Snapshot">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                <ChevronUp size={18} /> <h4 style={{ margin: 0 }}>Strengths</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Excellent code documentation</li>
                <li>Proactive communication</li>
                <li>Consistent delivery on time</li>
              </ul>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                <ChevronDown size={18} /> <h4 style={{ margin: 0 }}>Areas for Growth</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Take more lead on system architecture</li>
                <li>Improve test coverage metrics</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Performance;
