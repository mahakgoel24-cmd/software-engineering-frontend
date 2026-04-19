import { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { InsightBadge } from "../../components/ml/InsightBadge";
import { Wallet, DollarSign, CreditCard } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../supabaseClient";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ----------------------------------
   TypeScript workaround for Recharts
-----------------------------------*/
const XAxisComp = XAxis as any;
const YAxisComp = YAxis as any;
const LineComp = Line as any;
const TooltipComp = Tooltip as any;

interface DeveloperEarnings {
  available_balance: number;
  total_earned: number;
  rating: number;
  total_jobs: number;
  created_at: string;
}

/* ----------------------------------
   Generate visual earnings trend for last 6 months
-----------------------------------*/
const generateEarningsTrend = (total: number) => {
  const now = new Date();
  const months = [];
  
  // Generate last 6 months in chronological order (oldest first)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const value = Math.floor(total * (0.3 - (5 - i) * 0.05));
    months.push({ month: monthName, amount: value });
  }

  return months; // Already in chronological order (oldest first)
};

export default function Earnings() {
  const [data, setData] = useState<DeveloperEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  /* ----------------------------------
     Fetch earnings from Supabase
  -----------------------------------*/
  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user || authError) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("developers")
        .select(
          "available_balance, total_earned, rating, total_jobs, created_at"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch earnings:", error.message);
        setLoading(false);
        return;
      }

      setData(data);
      setLoading(false);
    };

    fetchEarnings();
  }, []);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      alert("Please enter a valid withdrawal amount");
      return;
    }
    
    if (amount > data!.available_balance) {
      alert("Withdrawal amount cannot exceed available balance");
      return;
    }

    setWithdrawing(true);
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Update available balance after withdrawal
      const newBalance = data!.available_balance - amount;
      
      const { error } = await supabase
        .from("developers")
        .update({ available_balance: newBalance })
        .eq("id", user.id);

      if (error) throw error;

      // Create withdrawal record (you might need to create a withdrawals table)
      alert(`Withdrawal of ₹${amount.toLocaleString()} successful!`);
      setWithdrawAmount("");
      
      // Refresh data
      setData(prev => prev ? { ...prev, available_balance: newBalance } : null);
      
    } catch (err) {
      console.error("Withdrawal error:", err);
      alert("Failed to process withdrawal. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return <p className="text-zinc-500">Loading earnings...</p>;
  }

  if (!data) {
    return <p className="text-zinc-500">No earnings data found.</p>;
  }

  const earningsTrend = generateEarningsTrend(data.total_earned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Earnings</h1>
        <p className="text-zinc-500 mt-1">
          Financial summary based on your developer profile
        </p>
      </div>

      {/* Top Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Earning Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-zinc-700">
                Earning Summary
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Available for Payout */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-700">Available for Payout</p>
                  <p className="text-lg font-bold text-emerald-900">
                    ₹{data.available_balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Total Earned */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">Total Earned</p>
                  <p className="text-lg font-bold text-blue-900">
                    ₹{data.total_earned.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-zinc-900">
                Withdraw Funds
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min="1"
                  max={data.available_balance}
                />
              </div>

              <Button
                onClick={handleWithdrawal}
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > data.available_balance}
                className="w-full"
              >
                {withdrawing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                    Processing...
                  </span>
                ) : (
                  "Withdraw Funds"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Earnings Graph */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">
            Earnings Trend
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsTrend}>
                <XAxisComp dataKey="month" />
                <YAxisComp />
                <TooltipComp />
                <LineComp
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}