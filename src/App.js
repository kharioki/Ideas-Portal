import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { InfinitySpin } from 'react-loader-spinner';

import abi from './utils/WavePortal.json';
import { getAllWaves } from './utils/methods';

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [waves, setWaves] = useState([]);

  const contractAddress = '0xE09363f95ad795978AeE58738E6892A382cD9a3b';
  const contractABI = abi.abi;

  // connect to wallet
  const connectToWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Please connect to MetaMask');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    setLoading(true);
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log('Total Waves', count.toNumber());

        // call createWave function on the contract
        const tx = await wavePortalContract.createWave("Wassup!!!", { gasLimit: 300000 });
        console.log('Transaction Hash', tx.hash);
        await tx.wait();
        console.log('Transaction Complete');

        count = await wavePortalContract.getTotalWaves();
        console.log('Total Waves', count.toNumber());
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const getAllWavesFromContract = async () => {
    setLoading(true);
    getAllWaves(contractAddress, contractABI)
      .then(w => {
        setWaves(w);
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
        setLoading(false);
      });
  };

  // listen in for emitter events
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('New Wave', from, timestamp, message);
      setWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message
        }]);
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    }
  }, []);

  useEffect(() => {
    if (currentAccount) {
      getAllWavesFromContract();
    }
  }, [currentAccount]);

  useEffect(() => {
    connectToWallet();
  }, []);

  console.log('Waves', waves);

  return (
    <div className="flex flex-1 flex-col min-h-screen font-mono text-gray-300 bg-[#282c34]">
      <header className="flex flex-col items-center justify-center p-4 mt-16">
        <h1 className='text-4xl font-semibold'>
          Idea's Portal
        </h1>
        <p className='text-lg'>
          Welcome to the Ideas Portal. Submit and vote on ideas.
        </p>

        {!currentAccount && (
          <button
            className='btn'
            onClick={connectToWallet}
          >
            Connect Wallet
          </button>
        )}
      </header>

      <main className="flex flex-col items-center justify-center p-4">
        <div className="flex flex-row items-center justify-center p-4">
          {loading && (
            <div className="flex justify-center mt-4">
              <InfinitySpin color="grey" size={50} />
            </div>
          )}
          {currentAccount && (
            <button className="btn" onClick={wave}>
              Add Idea
            </button>
          )}
        </div>
        <div className="flex flex-col items-center w-full flex-1 sm:px-12 xl:px-24 sm:py-6 text-center">
          {waves.length > 0 ? waves.map((w, index) => (
            <div key={index} className="flex flex-col items-center w-full flex-1 sm:px-12 xl:px-24 sm:py-6 text-center">
              <p className="text-lg">Address: {w.owner}</p>
              <p className="text-lg">Time: {w.timestamp.toString()}</p>
              <p className="text-lg">Message: {w.message}</p>
            </div>
          )) : (
            <p className="text-lg">No ideas yet</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
