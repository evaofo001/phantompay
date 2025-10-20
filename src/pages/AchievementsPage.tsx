import React from 'react';
import { Trophy, Target, CheckCircle, Circle, Zap, Crown } from 'lucide-react';
import { useAchievements } from '../contexts/AchievementsContext';

const AchievementsPage: React.FC = () => {
  const { achievements, challenges } = useAchievements();

  const formatEndDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Achievements & Challenges</h1>
        <p className="text-gray-600">Unlock rewards as you use PhantomPay</p>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`flex items-center p-4 border rounded-xl ${
                achievement.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors'
              }`}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white text-xl">
                {achievement.icon}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
              <div className="text-right">
                {achievement.completed ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span className="font-medium">+{achievement.points} pts</span>
                  </div>
                ) : (
                  <span className="text-orange-600 font-medium">+{achievement.points} pts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Challenges</h2>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className={`p-4 border rounded-xl ${
                challenge.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{challenge.title}</h3>
                  <p className="text-sm text-gray-600">{challenge.description}</p>
                </div>
                <div className="text-right">
                  {challenge.completed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span className="font-medium">Completed</span>
                    </div>
                  ) : (
                    <span className="text-orange-600 font-medium">+{challenge.rewardPoints} pts</span>
                  )}
                </div>
              </div>
              
              {!challenge.completed && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" 
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{challenge.progress} / {challenge.target}</span>
                    <span>Ends {formatEndDate(challenge.endDate)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <Target className="h-6 w-6" />
        </div>
        <p className="text-purple-100 mb-4">Compete with other users to climb the ranks!</p>
        <div className="space-y-3">
          {[1, 2, 3].map((rank) => (
            <div key={rank} className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-bold">
                  {rank}
                </div>
                <span className="ml-3">User {rank}</span>
              </div>
              <span className="font-bold">{1000 - (rank * 100)} pts</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 bg-white text-purple-600 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
};

export default AchievementsPage;