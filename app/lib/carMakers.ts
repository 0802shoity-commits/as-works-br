export type CarMaker = {
  name: string;
  models: string[];
};

// Marcas e modelos mais comuns no Brasil
export const CAR_MAKERS: CarMaker[] = [
  { name: 'Chevrolet', models: ['Onix', 'Onix Plus', 'Tracker', 'Montana', 'Spin', 'S10', 'Trailblazer', 'Equinox', 'Cruze', 'Prisma', 'Cobalt', 'Celta', 'Corsa', 'Agile', 'Classic'] },
  { name: 'Fiat', models: ['Strada', 'Argo', 'Mobi', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Titano', 'Fiorino', 'Ducato', 'Uno', 'Palio', 'Siena', 'Grand Siena', 'Doblò', 'Punto'] },
  { name: 'Volkswagen', models: ['Polo', 'Virtus', 'T-Cross', 'Nivus', 'Taos', 'Tera', 'Saveiro', 'Amarok', 'Gol', 'Voyage', 'Fox', 'Up!', 'Jetta', 'Golf', 'Tiguan', 'Fusca'] },
  { name: 'Toyota', models: ['Corolla', 'Corolla Cross', 'Yaris', 'Yaris Sedan', 'Hilux', 'SW4', 'RAV4', 'Etios', 'Camry'] },
  { name: 'Hyundai', models: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'ix35', 'Azera', 'HR'] },
  { name: 'Honda', models: ['City', 'City Hatch', 'HR-V', 'ZR-V', 'WR-V', 'Civic', 'CR-V', 'Fit', 'Accord'] },
  { name: 'Jeep', models: ['Renegade', 'Compass', 'Commander', 'Wrangler', 'Gladiator'] },
  { name: 'Renault', models: ['Kwid', 'Stepway', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Kardian', 'Captur', 'Master'] },
  { name: 'Nissan', models: ['Kicks', 'Versa', 'Sentra', 'Frontier', 'March'] },
  { name: 'Ford', models: ['Ranger', 'Maverick', 'Bronco Sport', 'Territory', 'Transit', 'Ka', 'Ka Sedan', 'EcoSport', 'Fiesta', 'Focus'] },
  { name: 'Peugeot', models: ['208', '2008', '3008', 'Partner', 'Expert', 'Boxer'] },
  { name: 'Citroën', models: ['C3', 'C3 Aircross', 'Basalt', 'C4 Cactus', 'Jumpy', 'Jumper'] },
  { name: 'Mitsubishi', models: ['L200 Triton', 'Pajero Sport', 'Outlander', 'Eclipse Cross', 'ASX'] },
  { name: 'BYD', models: ['Dolphin', 'Dolphin Mini', 'Song Plus', 'Song Pro', 'Yuan Plus', 'Seal', 'King', 'Shark'] },
  { name: 'GWM', models: ['Haval H6', 'Haval H9', 'Ora 03', 'Poer'] },
  { name: 'Caoa Chery', models: ['Tiggo 5x', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6'] },
  { name: 'Kia', models: ['Sportage', 'Sorento', 'Stonic', 'Niro', 'Cerato', 'Bongo'] },
  { name: 'BMW', models: ['Série 1', 'Série 3', 'Série 5', 'X1', 'X3', 'X5', 'X6', 'iX1', 'i4'] },
  { name: 'Mercedes-Benz', models: ['Classe A', 'Classe C', 'Classe E', 'GLA', 'GLB', 'GLC', 'GLE', 'Sprinter'] },
  { name: 'Audi', models: ['A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'] },
  { name: 'Volvo', models: ['XC40', 'XC60', 'XC90', 'EX30', 'C40'] },
];
