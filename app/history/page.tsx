'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UnpackEntry } from '@/lib/types';
import { getRecentEntries, getAllWords, getAssociations } from '@/lib/storage';
import StepShell from '@/components/StepShell';

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<UnpackEntry[]>([]);
  const [wordCounts, setWordCounts] = useState<{ word: string; count: number }[]>([]);
  const [associations, setAssociations] = useState<{ timeOfDay?: string; weekdayPattern?: string }>({});

  useEffect(() => {
    const recent = getRecentEntries(7);
    setEntries(recent);

    const words = getAllWords();
    const wordMap: Record<string, number> = {};
    getRecentEntries(30).forEach(entry => {
      entry.words.forEach(word => {
        wordMap[word] = (wordMap[word] || 0) + 1;
      });
    });
    setWordCounts(
      Object.entries(wordMap)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    );

    setAssociations(getAssociations());
  }, []);

  const chartData = entries.map((entry, index) => ({
    name: `Entry ${index + 1}`,
    intensity: entry.intensity,
    date: new Date(entry.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <StepShell title="Your History">
      <div className="w-full max-w-2xl space-y-12">
        {/* Intensity over time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-3xl p-6 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-light text-white/90 mb-6">Intensity over time</h2>
          {entries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#84cc16"
                  strokeWidth={2}
                  dot={{ fill: '#84cc16', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-center py-8">No entries yet</p>
          )}
        </motion.div>

        {/* Top words */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-3xl p-6 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-light text-white/90 mb-6">Words you've used</h2>
          {wordCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wordCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="word"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-center py-8">No words selected yet</p>
          )}
        </motion.div>

        {/* Associations */}
        {(associations.timeOfDay || associations.weekdayPattern) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-3xl p-6 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-light text-white/90 mb-6">Associations</h2>
            <div className="space-y-4 text-white/70">
              {associations.timeOfDay && (
                <p>Most check-ins happen in the <span className="text-white/90 font-medium">{associations.timeOfDay}</span>.</p>
              )}
              {associations.weekdayPattern && (
                <p>Intensity tends to be higher on <span className="text-white/90 font-medium">{associations.weekdayPattern}</span>.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={() => router.push('/')}
            className="px-8 py-4 rounded-full bg-white/10 text-white hover:bg-white/20 font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            New check-in
          </motion.button>
        </motion.div>
      </div>
    </StepShell>
  );
}

