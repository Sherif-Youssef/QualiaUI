import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { GlassCard } from '@/components/login/GlassCard';
import { IconInput } from '@/components/ui/IconInput';
import { Button } from '@/components/ui/button';
import bgImage from '../assets/Images/Login2.jpg';

export const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Section width="w-full" className="min-h-screen" background={`url(${bgImage}) center/cover no-repeat`}>
            <GlassCard>
                <Section width="w-full" className="text-gray-900 flex justify-center items-center py-12">
                    <div className="w-full px-6 max-w-[400px]">
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Login
                        </button>

                        <h2 className="text-[2em] font-bold mb-3 text-gray-900">Forgot Password?</h2>
                        <form className="w-full">
                            <IconInput label="Email Address" type="email" icon={Mail} required />

                            <Button className="w-full h-[45px] bg-gray-900 rounded-[40px] mt-4">
                                Send Reset Link
                            </Button>
                        </form>
                    </div>
                </Section>
            </GlassCard>
        </Section>
    );
};