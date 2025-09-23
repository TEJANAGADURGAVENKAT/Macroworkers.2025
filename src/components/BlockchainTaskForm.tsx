import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link, CheckCircle, X, Shield, IndianRupee, Calendar, Zap } from 'lucide-react';

const skillsByRole = {
  "Blockchain Developer": ["Solidity", "Web3.js", "Ethereum", "Smart Contracts", "DeFi Protocols"],
  "Smart Contract Auditor": ["Solidity", "Security Testing", "Gas Optimization", "MythX", "Slither"],
  "Web3 Developer": ["React.js", "Next.js", "Ethers.js", "IPFS", "Smart Contracts"],
  "Crypto Analyst": ["Technical Analysis", "Fundamental Analysis", "On-chain Data", "Market Trends", "Risk Management"],
  "Blockchain Architect": ["Consensus Mechanisms", "System Design", "Node Management", "Scalability", "Security"],
  "NFT/Token Developer": ["ERC-20", "ERC-721", "ERC-1155", "Tokenomics", "Minting Contracts"]
};

interface BlockchainTaskFormProps {
  onSubmit?: (formData: TaskFormData) => void;
  onCancel?: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  selectedRole: string;
  selectedSkills: string[];
  budget: string;
  deadline: string;
  difficulty: string;
  blockchain: string;
  projectType: string;
  securityLevel: string[];
}

const blockchainOptions = [
  "Ethereum",
  "Binance Smart Chain",
  "Polygon",
  "Solana",
  "Avalanche",
  "Cardano",
  "Polkadot",
  "Chainlink"
];

const projectTypeOptions = [
  "DeFi Protocol",
  "NFT Marketplace",
  "Smart Contract",
  "Token Creation",
  "dApp Development",
  "Blockchain Integration",
  "Security Audit",
  "Trading Bot"
];

const securityLevelOptions = [
  "Standard Security",
  "Enhanced Security",
  "High-Value Asset Protection",
  "Multi-Signature Required",
  "Formal Verification"
];

export const BlockchainTaskForm: React.FC<BlockchainTaskFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    selectedRole: '',
    selectedSkills: [],
    budget: '',
    deadline: '',
    difficulty: 'hard',
    blockchain: '',
    projectType: '',
    securityLevel: []
  });

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRole: role,
      selectedSkills: [], // Reset skills when role changes
      title: `${role} - Blockchain Project`
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSecurityToggle = (security: string) => {
    setFormData(prev => ({
      ...prev,
      securityLevel: prev.securityLevel.includes(security)
        ? prev.securityLevel.filter(s => s !== security)
        : [...prev.securityLevel, security]
    }));
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const isFormValid = formData.title && formData.description && formData.selectedRole && 
                     formData.selectedSkills.length > 0 && formData.budget && formData.blockchain;

  const availableSkills = formData.selectedRole ? skillsByRole[formData.selectedRole as keyof typeof skillsByRole] || [] : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center space-x-3">
            <Link className="h-6 w-6" />
            <CardTitle className="text-2xl">Create Blockchain Task</CardTitle>
          </div>
          <p className="text-purple-100 mt-2">
            Create a specialized blockchain development task with role-specific skill requirements
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Task Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Blockchain Developer - Smart Contract Development"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">
                  Budget (₹) *
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="budget"
                    type="number"
                    placeholder="50000"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Project Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the blockchain project requirements, technical specifications, and deliverables..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Link className="h-5 w-5 text-purple-600" />
                <span>Select Blockchain Role *</span>
              </Label>
              
              <Select value={formData.selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue placeholder="Choose a blockchain role for this project" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(skillsByRole).map((role) => (
                    <SelectItem key={role} value={role} className="cursor-pointer hover:bg-purple-50">
                      <div className="flex items-center space-x-2">
                        <Link className="h-4 w-4 text-purple-600" />
                        <span>{role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Selection */}
            {formData.selectedRole && (
              <div className="space-y-4 bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-800">
                    Required Skills for {formData.selectedRole} *
                  </Label>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {formData.selectedSkills.length} selected
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Select the specific blockchain skills required for this {formData.selectedRole.toLowerCase()} project.
                </p>
                
                {/* Available Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <Checkbox
                        id={skill}
                        checked={formData.selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                      <Label htmlFor={skill} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Selected Skills Display */}
                {formData.selectedSkills.length > 0 && (
                  <div className="mt-6">
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Selected Skills ({formData.selectedSkills.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-purple-100 text-purple-800 border border-purple-300 px-3 py-1 flex items-center space-x-2"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-purple-600 hover:text-purple-800 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blockchain Specific Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="blockchain" className="text-sm font-semibold text-gray-700">
                  Target Blockchain *
                </Label>
                <Select value={formData.blockchain} onValueChange={(value) => handleInputChange('blockchain', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select blockchain platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockchainOptions.map((blockchain) => (
                      <SelectItem key={blockchain} value={blockchain}>
                        {blockchain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType" className="text-sm font-semibold text-gray-700">
                  Project Type
                </Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Security Requirements */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Security Requirements</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {securityLevelOptions.map((security) => (
                  <div key={security} className="flex items-center space-x-2">
                    <Checkbox
                      id={security}
                      checked={formData.securityLevel.includes(security)}
                      onCheckedChange={() => handleSecurityToggle(security)}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <Label htmlFor={security} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {security}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-semibold text-gray-700">
                  Project Complexity
                </Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">Moderate (2-4 weeks)</SelectItem>
                    <SelectItem value="hard">Complex (1-3 months)</SelectItem>
                    <SelectItem value="expert">Expert Level (3+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">
                  Project Deadline
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {isFormValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span>Project details are ready to submit</span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 rounded-full bg-orange-400" />
                    <span>Please fill all required fields</span>
                  </>
                )}
              </div>
              
              <div className="flex space-x-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create Blockchain Project
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainTaskForm;
