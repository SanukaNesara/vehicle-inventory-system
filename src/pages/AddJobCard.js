import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2, FiSearch, FiRefreshCw } from 'react-icons/fi';

const AddJobCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [recentJobNos, setRecentJobNos] = useState([]);

  const [formData, setFormData] = useState({
    // Job Details
    job_no: '',
    job_date: new Date().toISOString().split('T')[0],
    in_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    
    // Vehicle Details
    vehicle_no: '',
    type: 'CAR',
    make: 'AUDI',
    model: 'A5',
    color: '',
    engine_no: '',
    chassis_no: '',
    man_year: '',
    in_milage: '',
    insurance_company: '',
    claim_no: '',
    date_of_accident: new Date().toISOString().split('T')[0],

    // Customer Details
    customer_name: '',
    id_no: '',
    address: '',
    mob_no: '',
    tel_no: '',
    fax_no: '',
    email: '',
    vat_no: '',
    technician: ''
  });

  const [selectedParts, setSelectedParts] = useState([]);

  useEffect(() => {
    fetchParts();
    fetchRecentJobNos();
  }, []);

  const fetchParts = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        'SELECT * FROM parts WHERE current_stock > 0 ORDER BY name'
      );
      setParts(result || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const fetchRecentJobNos = async () => {
    try {
      const result = await window.electronAPI.database.query(
        'all',
        `SELECT job_no, customer_name, created_at 
         FROM job_cards 
         WHERE job_no IS NOT NULL 
         ORDER BY created_at DESC 
         LIMIT 5`
      );
      setRecentJobNos(result || []);
    } catch (error) {
      console.error('Error fetching recent job numbers:', error);
    }
  };

  const generateJobNo = async () => {
    // If job_no already exists in form, don't generate a new one
    if (formData.job_no) {
      window.electronAPI.notification.show('Info', 'Job No. already generated');
      return;
    }

    try {
      // Get the highest used job number from actual job cards
      const result = await window.electronAPI.database.query(
        'get',
        `SELECT job_no 
         FROM job_cards 
         WHERE job_no IS NOT NULL 
         ORDER BY CAST(REPLACE(job_no, '0', '') AS INTEGER) DESC 
         LIMIT 1`
      );

      let nextValue;
      if (result && result.job_no) {
        // If there are existing job cards, increment from the highest number
        nextValue = parseInt(result.job_no) + 1;
      } else {
        // If no job cards exist, start from 1
        nextValue = 1;
      }

      // Format with leading zeros (6 digits)
      const jobNo = nextValue.toString().padStart(6, '0');
      setFormData(prev => ({ ...prev, job_no: jobNo }));
      await fetchRecentJobNos();
    } catch (error) {
      console.error('Error generating Job No:', error);
      window.electronAPI.notification.show('Error', 'Failed to generate Job No.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPart = (part) => {
    const existingIndex = selectedParts.findIndex(p => p.id === part.id);
    if (existingIndex >= 0) {
      // Update quantity if part already selected
      const updated = [...selectedParts];
      updated[existingIndex].quantity++;
      updated[existingIndex].total_price = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setSelectedParts(updated);
    } else {
      // Add new part
      setSelectedParts([...selectedParts, {
        ...part,
        quantity: 1,
        unit_price: part.final_selling_price,
        total_price: part.final_selling_price
      }]);
    }
    setShowPartSelector(false);
    setSearchTerm('');
  };

  const handleQuantityChange = (index, quantity) => {
    const updated = [...selectedParts];
    const maxQuantity = parts.find(p => p.id === updated[index].id)?.current_stock || 0;
    
    if (quantity <= 0) {
      updated.splice(index, 1);
    } else if (quantity <= maxQuantity) {
      updated[index].quantity = quantity;
      updated[index].total_price = quantity * updated[index].unit_price;
    } else {
      window.electronAPI.notification.show('Warning', `Only ${maxQuantity} units available in stock`);
      return;
    }
    
    setSelectedParts(updated);
  };

  const calculateTotal = () => {
    return selectedParts.reduce((sum, part) => sum + part.total_price, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.job_no) {
      window.electronAPI.notification.show('Error', 'Please generate a Job No. first');
      return;
    }
    
    setLoading(true);
    try {
      const result = await window.electronAPI.database.query(
        'run',
        `INSERT INTO job_cards (
          job_no, job_date, in_time, vehicle_no, vehicle_type,
          make, model, color, engine_no, chassis_no,
          man_year, in_milage, insurance_company, claim_no,
          date_of_accident, customer_type, customer_name,
          id_no, address, mob_no, tel_no, fax_no,
          email, vat_no, technician
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.job_no,
          formData.job_date,
          formData.in_time,
          formData.vehicle_no,
          formData.type,
          formData.make,
          formData.model,
          formData.color,
          formData.engine_no,
          formData.chassis_no,
          formData.man_year,
          formData.in_milage,
          formData.insurance_company,
          formData.claim_no,
          formData.date_of_accident,
          isNewCustomer ? 'new' : 'existing',
          formData.customer_name,
          formData.id_no,
          formData.address,
          formData.mob_no,
          formData.tel_no,
          formData.fax_no,
          formData.email,
          formData.vat_no,
          formData.technician
        ]
      );

      if (result && result.changes > 0) {
        window.electronAPI.notification.show('Success', 'Job card created successfully');
        navigate('/job-cards');
      } else {
        throw new Error('Failed to create job card');
      }
    } catch (error) {
      console.error('Error creating job card:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        window.electronAPI.notification.show('Error', 'Job number already exists');
      } else {
        window.electronAPI.notification.show('Error', 'Failed to create job card');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/job-cards')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Job Cards</span>
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Vehicle Registration</h1>
          
          {/* Recent Job Numbers */}
          <div className="bg-gray-700 rounded-lg p-4 min-w-[200px]">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Job Numbers</h3>
            <div className="space-y-2">
              {recentJobNos.map((job) => (
                <div 
                  key={job.job_no}
                  className="text-sm p-2 bg-gray-600 rounded"
                >
                  <div className="font-mono text-white">{job.job_no}</div>
                  <div className="text-xs text-gray-400 truncate">{job.customer_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job No</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="job_no"
                  value={formData.job_no}
                  readOnly
                  placeholder="Click arrow to generate"
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={generateJobNo}
                  disabled={!!formData.job_no}
                  className={`px-3 py-2 rounded-md transition-colors
                    ${formData.job_no 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800'
                    }`}
                >
                  <FiRefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Date</label>
              <input
                type="date"
                name="job_date"
                value={formData.job_date}
                onChange={handleChange}
                className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">In Time</label>
              <input
                type="time"
                name="in_time"
                value={formData.in_time}
                onChange={handleChange}
                className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
            <h2 className="text-lg font-medium text-white mb-4">Vehicle Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle No</label>
                <input
                  type="text"
                  name="vehicle_no"
                  value={formData.vehicle_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="WPKS-1661">WPKS-1661</option>
                  <option value="WPGS-2296">WPGS-2296</option>
                  <option value="WORKSHOP">WORKSHOP</option>
                  <option value="WORK SHOP">WORK SHOP</option>
                  <option value="VW">VW</option>
                  <option value="VAN">VAN</option>
                  <option value="UNIQUE RIDES">UNIQUE RIDES</option>
                  <option value="UNIQUE 1">UNIQUE 1</option>
                  <option value="TRUCK">TRUCK</option>
                  <option value="SUV">SUV</option>
                  <option value="SU V">SU V</option>
                  <option value="SEDARN">SEDARN</option>
                  <option value="SCODA">SCODA</option>
                  <option value="Q5">Q5</option>
                  <option value="Q3">Q3</option>
                  <option value="Q2">Q2</option>
                  <option value="MR.IMTIYAZ *">MR.IMTIYAZ *</option>
                  <option value="MR.IMTIYAZ">MR.IMTIYAZ</option>
                  <option value="MR.GIHAN NEW">MR.GIHAN NEW</option>
                  <option value="LORRY">LORRY</option>
                  <option value="JEEP">JEEP</option>
                  <option value="JAYASEKARA">JAYASEKARA</option>
                  <option value="HATCHBACK">HATCHBACK</option>
                  <option value="GENERATOR 1">GENERATOR 1</option>
                  <option value="GEEP">GEEP</option>
                  <option value="CREW CAB">CREW CAB</option>
                  <option value="CR">CR</option>
                  <option value="CAT">CAT</option>
                  <option value="CAR">CAR</option>
                  <option value="CAB">CAB</option>
                  <option value="AUDI">AUDI</option>
                  <option value="A3">A3</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Make</label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="WAXWAGON">WAXWAGON</option>
                  <option value="WALKSWAGON">WALKSWAGON</option>
                  <option value="WALKSWAGEN">WALKSWAGEN</option>
                  <option value="WALKSWAGAN">WALKSWAGAN</option>
                  <option value="WALKSAGON">WALKSAGON</option>
                  <option value="VW">VW</option>
                  <option value="VOLKSWAGON">VOLKSWAGON</option>
                  <option value="VOLKSWAGEN">VOLKSWAGEN</option>
                  <option value="VAN">VAN</option>
                  <option value="VALKSWAGON">VALKSWAGON</option>
                  <option value="V">V</option>
                  <option value="UK">UK</option>
                  <option value="TOYOTA">TOYOTA</option>
                  <option value="TOYATA">TOYATA</option>
                  <option value="TIGUAN">TIGUAN</option>
                  <option value="SUZUKI">SUZUKI</option>
                  <option value="SUV">SUV</option>
                  <option value="SUSUKI-SWIFT">SUSUKI-SWIFT</option>
                  <option value="SUSUKI">SUSUKI</option>
                  <option value="SUBARU">SUBARU</option>
                  <option value="STINGRAY">STINGRAY</option>
                  <option value="SKODA">SKODA</option>
                  <option value="SEAT">SEAT</option>
                  <option value="SCODA">SCODA</option>
                  <option value="RENAULT">RENAULT</option>
                  <option value="RANGE ROVER">RANGE ROVER</option>
                  <option value="Q2">Q2</option>
                  <option value="PORSCHE">PORSCHE</option>
                  <option value="PORCHI">PORCHI</option>
                  <option value="POCSCHE">POCSCHE</option>
                  <option value="PEUGEOT">PEUGEOT</option>
                  <option value="PERADUA">PERADUA</option>
                  <option value="NISSAN">NISSAN</option>
                  <option value="MITSUBISHI">MITSUBISHI</option>
                  <option value="MITSHUBISHY">MITSHUBISHY</option>
                  <option value="MITSHUBISHI">MITSHUBISHI</option>
                  <option value="MICRO">MICRO</option>
                  <option value="MERC">MERC</option>
                  <option value="MAZDA">MAZDA</option>
                  <option value="LANDROVER">LANDROVER</option>
                  <option value="LAMBORGHINI">LAMBORGHINI</option>
                  <option value="KIA">KIA</option>
                  <option value="JEEP">JEEP</option>
                  <option value="ISUZU">ISUZU</option>
                  <option value="HYHUNDAI">HYHUNDAI</option>
                  <option value="HONDA">HONDA</option>
                  <option value="HINDA">HINDA</option>
                  <option value="GEEP">GEEP</option>
                  <option value="FORD">FORD</option>
                  <option value="CIAT">CIAT</option>
                  <option value="CAR">CAR</option>
                  <option value="BORGWARD">BORGWARD</option>
                  <option value="BMW">BMW</option>
                  <option value="BFB">BFB</option>
                  <option value="BENZ">BENZ</option>
                  <option value="AUDI E TRON">AUDI E TRON</option>
                  <option value="AUDI">AUDI</option>
                  <option value="AUD1">AUD1</option>
                  <option value="AUD">AUD</option>
                  <option value="ALT0">ALT0</option>
                  <option value="AIDU">AIDU</option>
                  <option value="ADUI">ADUI</option>
                  <option value="AAAA">AAAA</option>
                  <option value="A6">A6</option>
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
                <select
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="X1">X1</option>
                  <option value="WHITE">WHITE</option>
                  <option value="WASH BAY">WASH BAY</option>
                  <option value="WAGANR-">WAGANR-</option>
                  <option value="VW">VW</option>
                  <option value="VITZ">VITZ</option>
                  <option value="VITO">VITO</option>
                  <option value="VITARA">VITARA</option>
                  <option value="VEZZEL">VEZZEL</option>
                  <option value="VEZEL">VEZEL</option>
                  <option value="VENTO">VENTO</option>
                  <option value="UPI">UPI</option>
                  <option value="UP">UP</option>
                  <option value="TT">TT</option>
                  <option value="TRONSPOTOR">TRONSPOTOR</option>
                  <option value="T-ROC">T-ROC</option>
                  <option value="TRANSPOTER">TRANSPOTER</option>
                  <option value="TRANSPORTER">TRANSPORTER</option>
                  <option value="TOUREG">TOUREG</option>
                  <option value="TOURAG">TOURAG</option>
                  <option value="TOUEREG">TOUEREG</option>
                  <option value="TOUAREG">TOUAREG</option>
                  <option value="TOARAG">TOARAG</option>
                  <option value="TIGUWAN">TIGUWAN</option>
                  <option value="TIGUAN ALLSPACE">TIGUAN ALLSPACE</option>
                  <option value="TIGUAN">TIGUAN</option>
                  <option value="TD4">TD4</option>
                  <option value="T-CROSS">T-CROSS</option>
                  <option value="TCROSS">TCROSS</option>
                  <option value="T CROSS">T CROSS</option>
                  <option value="SUSUKI">SUSUKI</option>
                  <option value="SUPERB">SUPERB</option>
                  <option value="SUNNY">SUNNY</option>
                  <option value="SUNNEY">SUNNEY</option>
                  <option value="SPORTAE">SPORTAE</option>
                  <option value="SMART">SMART</option>
                  <option value="SKODA">SKODA</option>
                  <option value="SCODA">SCODA</option>
                  <option value="S1">S1</option>
                  <option value="R35">R35</option>
                  <option value="RIO">RIO</option>
                  <option value="RG51523">RG51523</option>
                  <option value="R32">R32</option>
                  <option value="Q8">Q8</option>
                  <option value="Q7">Q7</option>
                  <option value="Q6">Q6</option>
                  <option value="Q5">Q5</option>
                  <option value="Q4">Q4</option>
                  <option value="Q3">Q3</option>
                  <option value="Q2">Q2</option>
                  <option value="PRIYAS">PRIYAS</option>
                  <option value="PRIUS">PRIUS</option>
                  <option value="PRIMIYO">PRIMIYO</option>
                  <option value="PRADO">PRADO</option>
                  <option value="PORSCHE">PORSCHE</option>
                  <option value="POPO">POPO</option>
                  <option value="POLO R LINE">POLO R LINE</option>
                  <option value="POLO GT">POLO GT</option>
                  <option value="POLO">POLO</option>
                  <option value="PASSO">PASSO</option>
                  <option value="PASSAT CC">PASSAT CC</option>
                  <option value="PASSAT">PASSAT</option>
                  <option value="PASSART WAGON">PASSART WAGON</option>
                  <option value="PASSART">PASSART</option>
                  <option value="PANDA">PANDA</option>
                  <option value="PAJERO">PAJERO</option>
                  <option value="OCTAVIA">OCTAVIA</option>
                  <option value="MU-X">MU-X</option>
                  <option value="MULTI VAN">MULTI VAN</option>
                  <option value="MONTERO">MONTERO</option>
                  <option value="MK1">MK1</option>
                  <option value="MARUTI ZEN">MARUTI ZEN</option>
                  <option value="MARUTI">MARUTI</option>
                  <option value="MARCH">MARCH</option>
                  <option value="MACAN">MACAN</option>
                  <option value="LEAF">LEAF</option>
                  <option value="LAND CRUISER">LAND CRUISER</option>
                  <option value="KWID">KWID</option>
                  <option value="KODIAQ">KODIAQ</option>
                  <option value="KODIAG">KODIAG</option>
                  <option value="KODI">KODI</option>
                  <option value="KDH">KDH</option>
                  <option value="KAROQ">KAROQ</option>
                  <option value="JETTA">JETTA</option>
                  <option value="JEETA">JEETA</option>
                  <option value="IMPREZA">IMPREZA</option>
                  <option value="ID5">ID5</option>
                  <option value="ID4">ID4</option>
                  <option value="ID 4">ID 4</option>
                  <option value="HYUNDAI">HYUNDAI</option>
                  <option value="HYBRIDE">HYBRIDE</option>
                  <option value="HUSTLER">HUSTLER</option>
                  <option value="HILUX">HILUX</option>
                  <option value="GTE">GTE</option>
                  <option value="GT POLO">GT POLO</option>
                  <option value="GT">GT</option>
                  <option value="GRACE">GRACE</option>
                  <option value="GOLF-GT">GOLF-GT</option>
                  <option value="GOLF">GOLF</option>
                  <option value="GLC250">GLC250</option>
                  <option value="GALANT">GALANT</option>
                  <option value="FOCUS">FOCUS</option>
                  <option value="FABIA">FABIA</option>
                  <option value="EWOQ">EWOQ</option>
                  <option value="EVOQUE">EVOQUE</option>
                  <option value="EVERY">EVERY</option>
                  <option value="E-GOLF GTE">E-GOLF GTE</option>
                  <option value="E-GOLF">E-GOLF</option>
                  <option value="E300D">E300D</option>
                  <option value="E200">E200</option>
                  <option value="E GOLF">E GOLF</option>
                  <option value="E 350">E 350</option>
                  <option value="E320">E320</option>
                  <option value="E300">E300</option>
                  <option value="E 240">E 240</option>
                  <option value="DISCOVERY">DISCOVERY</option>
                  <option value="CRZ">CRZ</option>
                  <option value="CRV">CRV</option>
                  <option value="CRAFTER">CRAFTER</option>
                  <option value="COROLLA">COROLLA</option>
                  <option value="COMPRESSOR C 180">COMPRESSOR C 180</option>
                  <option value="CIVIC">CIVIC</option>
                  <option value="C">C</option>
                  <option value="CAYENNES HYBRID">CAYENNES HYBRID</option>
                  <option value="CAYENNES">CAYENNES</option>
                  <option value="CAYENNE">CAYENNE</option>
                  <option value="CARINA/MY ROAD">CARINA/MY ROAD</option>
                  <option value="CARAVELLE">CARAVELLE</option>
                  <option value="CABRIOLT">CABRIOLT</option>
                  <option value="BX5">BX5</option>
                  <option value="BORRA">BORRA</option>
                  <option value="BORABLACK">BORABLACK</option>
                  <option value="BORA">BORA</option>
                  <option value="BMW-520D">BMW-520D</option>
                  <option value="BLUE">BLUE</option>
                  <option value="BITTEL">BITTEL</option>
                  <option value="BETTLE">BETTLE</option>
                  <option value="BETTEL">BETTEL</option>
                  <option value="BETLE">BETLE</option>
                  <option value="BETEL">BETEL</option>
                  <option value="BENZ">BENZ</option>
                  <option value="BENTLY">BENTLY</option>
                  <option value="BEETLE">BEETLE</option>
                  <option value="BEETEL">BEETEL</option>
                  <option value="BEELTE">BEELTE</option>
                  <option value="BBBB">BBBB</option>
                  <option value="AXIO">AXIO</option>
                  <option value="AXIA">AXIA</option>
                  <option value="AVARA">AVARA</option>
                  <option value="AUDI A4">AUDI A4</option>
                  <option value="AUDI A3">AUDI A3</option>
                  <option value="AUDI">AUDI</option>
                  <option value="ARONA">ARONA</option>
                  <option value="AQUA">AQUA</option>
                  <option value="AMG">AMG</option>
                  <option value="ALTO">ALTO</option>
                  <option value="AI">AI</option>
                  <option value="ACTYON">ACTYON</option>
                  <option value="A8L HYBRID">A8L HYBRID</option>
                  <option value="A8L">A8L</option>
                  <option value="A8-HYBRID">A8-HYBRID</option>
                  <option value="A8 L">A8 L</option>
                  <option value="A8 HYBRID">A8 HYBRID</option>
                  <option value="A8">A8</option>
                  <option value="A7">A7</option>
                  <option value="A6BLACK">A6BLACK</option>
                  <option value="A6 WAGEN">A6 WAGEN</option>
                  <option value="A6... VAGAN">A6... VAGAN</option>
                  <option value="A6 HYBRID">A6 HYBRID</option>
                  <option value="A6 HYBRD">A6 HYBRD</option>
                  <option value="A6-">A6-</option>
                  <option value="A6">A6</option>
                  <option value="A5 CONVERTIBLE">A5 CONVERTIBLE</option>
                  <option value="A5">A5</option>
                  <option value="A4 2018">A4 2018</option>
                  <option value="A4">A4</option>
                  <option value="A3 SEDAN">A3 SEDAN</option>
                  <option value="A3 HATCHBACK">A3 HATCHBACK</option>
                  <option value="A3">A3</option>
                  <option value="A2">A2</option>
                  <option value="A1 WHITE">A1 WHITE</option>
                  <option value="A1 TWO DOOR">A1 TWO DOOR</option>
                  <option value="A1">A1</option>
                  <option value="730D">730D</option>
                  <option value="530 E">530 E</option>
                  <option value="523I">523I</option>
                  <option value="4A">4A</option>
                  <option value="320D">320D</option>
                  <option value="308">308</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Engine No</label>
                <input
                  type="text"
                  name="engine_no"
                  value={formData.engine_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Chassis No</label>
                <input
                  type="text"
                  name="chassis_no"
                  value={formData.chassis_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Man. Year</label>
                <input
                  type="text"
                  name="man_year"
                  value={formData.man_year}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">In Milage</label>
                <input
                  type="text"
                  name="in_milage"
                  value={formData.in_milage}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Insurance Company</label>
                <input
                  type="text"
                  name="insurance_company"
                  value={formData.insurance_company}
                  onChange={handleChange}
                  placeholder="Enter insurance company"
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Claim No</label>
                <input
                  type="text"
                  name="claim_no"
                  value={formData.claim_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date of Accident</label>
                <input
                  type="date"
                  name="date_of_accident"
                  value={formData.date_of_accident}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-medium text-white">Customer Details</h2>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="customer_type"
                    checked={!isNewCustomer}
                    onChange={() => setIsNewCustomer(false)}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-2 text-gray-300">Existing Customer</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="customer_type"
                    checked={isNewCustomer}
                    onChange={() => setIsNewCustomer(true)}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-2 text-gray-300">New Customer</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ID No</label>
                <input
                  type="text"
                  name="id_no"
                  value={formData.id_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mob No</label>
                <input
                  type="text"
                  name="mob_no"
                  value={formData.mob_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tel No</label>
                <input
                  type="text"
                  name="tel_no"
                  value={formData.tel_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fax No</label>
                <input
                  type="text"
                  name="fax_no"
                  value={formData.fax_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">E-Mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vat No</label>
                <input
                  type="text"
                  name="vat_no"
                  value={formData.vat_no}
                  onChange={handleChange}
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technician</label>
                <input
                  type="text"
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  placeholder="Enter technician name"
                  className="bg-gray-900 text-white border border-gray-700 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/job-cards')}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                       transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                       transition-colors"
            >
              Print
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
                       transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800
                       transition-colors"
            >
              Exit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobCard;