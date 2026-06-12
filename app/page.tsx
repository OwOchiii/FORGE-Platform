'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, MessageSquare, Award, Users, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (user || isLoading) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Image
            src="/logo-forge.png"
            alt="FORGE Training Platform"
            width={50}
            height={50}
            className="h-10 w-auto dark:invert"
            style={{ width: 'auto', height: '2.5rem' }}
          />
          <span className="text-orange-600 dark:text-orange-500">FORGE</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="dark:text-gray-300">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white hover:from-orange-700 hover:to-red-700">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        <motion.div 
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-500 bg-clip-text text-transparent mb-6"
          >
            Master Your Skills with FORGE
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8"
          >
            The AI-powered training platform that helps employees learn faster, smarter, and better. Personalized courses, expert guidance, and real-time support.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white hover:from-orange-700 hover:to-red-700 w-full sm:w-auto transition-transform hover:scale-105">
                Start Learning Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto dark:border-gray-600 dark:text-gray-300 transition-transform hover:scale-105">
                Already Have Account? Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {[
            {
              icon: BookOpen,
              title: 'Structured Courses',
              description: 'Learn through organized modules, lessons, and quizzes',
            },
            {
              icon: MessageSquare,
              title: 'AI Assistant',
              description: 'Get instant answers and personalized learning support',
            },
            {
              icon: Award,
              title: 'Certifications',
              description: 'Earn certificates upon course completion',
            },
            {
              icon: Users,
              title: 'Collaborative',
              description: 'Learn alongside your peers and grow together',
            },
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
            >
              <feature.icon className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-slate-800/50 border-t border-b border-gray-200 dark:border-slate-700 py-12 transition-colors duration-300">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">500+</div>
              <p className="text-gray-600 dark:text-gray-400">Active Trainees</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">50+</div>
              <p className="text-gray-600 dark:text-gray-400">Expert-Crafted Courses</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">95%</div>
              <p className="text-gray-600 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 text-balance">
            Pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Choose a plan that fits your team size and sales training needs.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
          }}
        >
          {/* FREE */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 dark:text-orange-400 mb-2">Free</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Experience FORGE</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500 dark:text-gray-400 mb-1">/ month</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Discover how FORGE helps sales reps practice with AI customers.
              </p>
            </div>
            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {[
                'Access demo classes',
                'Practice AI Sales Simulations',
                'Get feedback after each session',
                'Track personal progress',
                'Join invited classes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full dark:border-slate-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors">
                Start free
              </Button>
            </Link>
          </motion.div>

          {/* TEAM — highlighted */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="flex flex-col rounded-2xl border-2 border-orange-500 dark:border-orange-500 bg-white dark:bg-slate-800 p-8 shadow-xl relative"
          >
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
              Most popular
            </span>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 dark:text-orange-400 mb-2">Team</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Build your sales training system</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$199</span>
                <span className="text-gray-500 dark:text-gray-400 mb-1">/ month</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Turn product data into a real-world training environment.
              </p>
            </div>
            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {[
                'Create and manage classes',
                'Upload product documentation',
                'AI generates customer archetypes',
                'Edit and approve archetypes',
                'Student dashboard',
                'Fact-checking after simulations',
                'Up to 20 students',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup">
              <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white hover:from-orange-700 hover:to-red-700 transition-transform hover:scale-105">
                Start trial
              </Button>
            </Link>
          </motion.div>

          {/* ENTERPRISE */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-sm"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 dark:text-orange-400 mb-2">Enterprise</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Enterprise deployment</h3>
              <div className="flex items-end gap-1 mt-4">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">Custom pricing</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Customize FORGE for your organization's workflows and data.
              </p>
            </div>
            <ul className="flex flex-col gap-3 flex-1 mb-8">
              {[
                'Multiple admins',
                'Multi-department management',
                'CRM integration',
                'API access',
                'Advanced analytics dashboard',
                'Cross-team performance comparison',
                'Custom organization rules',
                'Dedicated implementation support',
                'Unlimited students',
                'Customer Success Manager',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 shrink-0 text-orange-500 dark:text-orange-400 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full dark:border-slate-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors">
                Contact sales
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of employees who are advancing their careers on FORGE.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-500 dark:to-red-500 text-white hover:from-orange-700 hover:to-red-700 transition-transform hover:scale-105">
              Create Your Account Today
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-gray-400 py-8 border-t border-gray-800 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2024 FORGE Training Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
