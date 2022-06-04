import { ethers } from 'ethers';

export const getAllWaves = async (contractAddress, contractABI) => {
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const _wavesLength = await wavePortalContract.getTotalWaves();
      const waves = [];

      for (let i = 0; i < _wavesLength; i++) {
        let _wave = new Promise(async (resolve, reject) => {
          const w = await wavePortalContract.getWave(i);
          resolve({
            index: i,
            owner: w[0],
            message: w[1],
            timestamp: w[2],
          })
        });
        waves.push(_wave);
      }
      return await Promise.all(waves);
    }
  } catch (error) {
    console.log(error);
  }
}
