import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, TrendingUp, Clock, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Poll } from "../types";
import { PollCard } from "../components/PollCard";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "ended" | "mine"
  >("all");
  const [stats, setStats] = useState({
    totalPolls: 0,
    totalVotes: 0,
    activePolls: 0,
  });

  useEffect(() => {
    fetchPolls();
    fetchStats();
  }, [filterStatus, user]);

  useEffect(() => {
    // Real-time subscription for new polls
    const channel = supabase
      .channel("polls-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "polls" },
        (payload) => {
          const newPoll = payload.new as Poll;
          setPolls((prev) => [newPoll, ...prev]);
          setStats((prev) => ({
            ...prev,
            totalPolls: prev.totalPolls + 1,
            activePolls: prev.activePolls + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { data: pollsData } = await supabase
        .from("polls")
        .select("id, ends_at");

      const { data: votesData } = await supabase.from("votes").select("id");

      const now = new Date();
      const activePolls =
        pollsData?.filter(
          (poll) => !poll.ends_at || new Date(poll.ends_at) > now
        ).length || 0;

      setStats({
        totalPolls: pollsData?.length || 0,
        totalVotes: votesData?.length || 0,
        activePolls,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPolls = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus === "active") {
        query = query.or(
          `ends_at.is.null,ends_at.gt.${new Date().toISOString()}`
        );
      } else if (filterStatus === "ended") {
        query = query.lt("ends_at", new Date().toISOString());
      } else if (filterStatus === "mine" && user) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Optionally fetch creator emails if needed
      const pollsWithVotes = await Promise.all(
        (data || []).map(async (poll) => {
          const { count } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);

          let creator_email = null;
          if (poll.created_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", poll.created_by)
              .single();
            creator_email = profile?.email || null;
          }

          return {
            ...poll,
            creator_email,
            vote_count: count || 0,
          };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolls = polls.filter((poll) =>
    poll.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Create Amazing Polls
        </h1>
        <p className="text-xl mb-8 text-blue-100">
          Get real-time feedback from your audience with beautiful, interactive
          polls
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {user ? (
            <Link
              to="/create"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Poll
            </Link>
          ) : (
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              Get Started Free
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPolls}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalVotes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Polls</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activePolls}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "ended" | "mine"
              )
            }
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Polls</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            {user && <option value="mine">My Polls</option>}
          </select>
        </div>
      </div>

      {/* Polls Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No polls found" : "No polls yet"}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "Try adjusting your search terms"
              : user
              ? "Create the first poll to get started!"
              : "Sign up to create amazing polls"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}
