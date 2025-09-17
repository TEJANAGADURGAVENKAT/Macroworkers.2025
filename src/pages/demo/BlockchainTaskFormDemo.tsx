import React from 'react';
import { BlockchainTaskForm } from '@/components/BlockchainTaskForm';
import { useToast } from '@/hooks/use-toast';

const BlockchainTaskFormDemo = () => {
  const { toast } = useToast();

  const handleSubmit = (formData: any) => {
    console.log('Blockchain Project submitted:', formData);
    toast({
      title: "Blockchain Project Created Successfully!",
      description: `Created ${formData.selectedRole} project with ${formData.selectedSkills.length} required skills on ${formData.blockchain} blockchain.`,
    });
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    toast({
      title: "Project Creation Cancelled",
      description: "No changes were saved.",
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blockchain Task Creation Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This demo showcases the Blockchain Task Form component with role-based skill selection.
            Select a blockchain role to see the relevant skills mapped to that specialization.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-5xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">Blockchain Developer</h3>
              <p className="text-xs text-gray-600">Core blockchain development skills</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">Smart Contract Auditor</h3>
              <p className="text-xs text-gray-600">Security and audit expertise</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">Web3 Developer</h3>
              <p className="text-xs text-gray-600">Frontend blockchain integration</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">Crypto Analyst</h3>
              <p className="text-xs text-gray-600">Market analysis and trends</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">Blockchain Architect</h3>
              <p className="text-xs text-gray-600">System design and scalability</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-purple-700 mb-2">NFT/Token Developer</h3>
              <p className="text-xs text-gray-600">Token standards and minting</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold text-purple-800 mb-2">🔗 Supported Blockchains</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Ethereum", "Binance Smart Chain", "Polygon", "Solana", "Avalanche", "Cardano", "Polkadot", "Chainlink"].map((blockchain) => (
                <span key={blockchain} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  {blockchain}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <BlockchainTaskForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default BlockchainTaskFormDemo;
