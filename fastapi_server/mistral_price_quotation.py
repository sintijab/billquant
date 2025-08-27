import os
import re
import json
from langchain.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()
# Mistral setup
if "MISTRAL_API_KEY" not in os.environ:
    raise RuntimeError("MISTRAL_API_KEY not found in environment. Please set it in your .env file.")

llm = ChatMistralAI(
    model="mistral-small-latest",
    temperature=0,
    max_retries=2,
)

# Internal costs structure with all values stringified and projectSchedule populated
internal_costs = {
  "offer_title": "OFFERTA ECONOMICA LAVORI DI TINTEGGIATURA E MANUTENZIONE STRAORDINARIA",
  "cost_description": "Dettaglio dei costi per i lavori di tinteggiatura e manutenzione straordinaria in un sito di costruzione residenziale, inclusi demolizione, installazione e pittura.",
  "currency": "eur",
  "site_area_summary": [
    {
      "area": "Area 1",
      "total_cost": "45000",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "51750.00",
      "materials": "18000",
      "labor": "12000",
      "subcontractors": "8000",
      "equipment": "7000",
      "resource_types": [
        "mezzi",
        "strumenti",
        "personale",
        "superficie"
      ],
      "resources": [
        {
          "name": "furgone cassonato",
          "type": "mezzi",
          "quantity": "1",
          "unit": "giorno",
          "unitPrice": "100",
          "totalPrice": "500"
        },
        {
          "name": "contenitori per macerie",
          "type": "mezzi",
          "quantity": "2",
          "unit": "giorno",
          "unitPrice": "50",
          "totalPrice": "500"
        },
        {
          "name": "martelli demolitori",
          "type": "strumenti",
          "quantity": "3",
          "unit": "giorno",
          "unitPrice": "30",
          "totalPrice": "450"
        },
        {
          "name": "piede di porco",
          "type": "strumenti",
          "quantity": "4",
          "unit": "giorno",
          "unitPrice": "10",
          "totalPrice": "200"
        },
        {
          "name": "flex",
          "type": "strumenti",
          "quantity": "2",
          "unit": "giorno",
          "unitPrice": "40",
          "totalPrice": "400"
        },
        {
          "name": "carrelli",
          "type": "strumenti",
          "quantity": "3",
          "unit": "giorno",
          "unitPrice": "20",
          "totalPrice": "300"
        },
        {
          "name": "muratori",
          "type": "personale",
          "quantity": "5",
          "unit": "ora",
          "unitPrice": "30",
          "totalPrice": "3000"
        },
        {
          "name": "superficie da pitturare",
          "type": "superficie",
          "quantity": "200",
          "unit": "m2"
        },
        {
          "name": "pennelli e rulli",
          "type": "strumenti",
          "quantity": "10",
          "unit": "pezzo",
          "unitPrice": "5",
          "totalPrice": "50"
        }
      ],
      "work_activities": [
        {
          "description": "Tinteggiatura pareti interne con idropittura lavabile",
          "quantity": "200",
          "unit": "m2",
          "unitPrice": "12.50",
          "totalPrice": "2500.00"
        },
        {
          "description": "Rimozione vecchia pittura e preparazione superficie",
          "quantity": "200",
          "unit": "m2",
          "unitPrice": "5.00",
          "totalPrice": "1000.00"
        },
        {
          "description": "Applicazione primer",
          "quantity": "200",
          "unit": "m2",
          "unitPrice": "3.00",
          "totalPrice": "600.00"
        }
      ]
    },
    {
      "area": "Area 2",
      "total_cost": "60000",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "69000.00",
      "materials": "25000",
      "labor": "15000",
      "subcontractors": "10000",
      "equipment": "10000",
      "resource_types": [
        "mezzi",
        "strumenti",
        "personale",
        "superficie"
      ],
      "resources": [
        {
          "name": "furgone cassonato",
          "type": "mezzi",
          "quantity": "1",
          "unit": "giorno",
          "unitPrice": "100",
          "totalPrice": "700"
        },
        {
          "name": "contenitori per macerie",
          "type": "mezzi",
          "quantity": "3",
          "unit": "giorno",
          "unitPrice": "50",
          "totalPrice": "750"
        },
        {
          "name": "martelli demolitori",
          "type": "strumenti",
          "quantity": "4",
          "unit": "giorno",
          "unitPrice": "30",
          "totalPrice": "600"
        },
        {
          "name": "piede di porco",
          "type": "strumenti",
          "quantity": "5",
          "unit": "giorno",
          "unitPrice": "10",
          "totalPrice": "250"
        },
        {
          "name": "flex",
          "type": "strumenti",
          "quantity": "3",
          "unit": "giorno",
          "unitPrice": "40",
          "totalPrice": "600"
        },
        {
          "name": "carrelli",
          "type": "strumenti",
          "quantity": "4",
          "unit": "giorno",
          "unitPrice": "20",
          "totalPrice": "400"
        },
        {
          "name": "muratori",
          "type": "personale",
          "quantity": "6",
          "unit": "ora",
          "unitPrice": "30",
          "totalPrice": "3600"
        },
        {
          "name": "superficie terrazzo",
          "type": "superficie",
          "quantity": "100",
          "unit": "m2"
        },
        {
          "name": "scaffalatura temporanea",
          "type": "strumenti",
          "quantity": "1",
          "unit": "settimana",
          "unitPrice": "200",
          "totalPrice": "400"
        }
      ],
      "work_activities": [
        {
          "description": "Demolizione maniglie esistenti terrazzo",
          "quantity": "10",
          "unit": "pezzo",
          "unitPrice": "20.00",
          "totalPrice": "200.00"
        },
        {
          "description": "Installazione nuove maniglie terrazzo",
          "quantity": "10",
          "unit": "pezzo",
          "unitPrice": "50.00",
          "totalPrice": "500.00"
        },
        {
          "description": "Rimozione detriti e pulizia area",
          "quantity": "100",
          "unit": "m2",
          "unitPrice": "5.00",
          "totalPrice": "500.00"
        },
        {
          "description": "Demolizione sottofondo cementizio con attrezzature elettriche",
          "quantity": "100",
          "unit": "m2",
          "unitPrice": "10.00",
          "totalPrice": "1000.00"
        },
        {
          "description": "Trasporto manuale e carico su mezzo di cantiere per smaltimento in discarica autorizzata",
          "quantity": "5",
          "unit": "t",
          "unitPrice": "150.00",
          "totalPrice": "750.00"
        },
        {
          "description": "Pulizia finale dell'area",
          "quantity": "100",
          "unit": "m2",
          "unitPrice": "3.00",
          "totalPrice": "300.00"
        }
      ]
    }
  ],
  "materialsList": [
    {
      "item": "RIFIUTI INGOMBRANTI NON INERTI serramenti, avvolgibili, pallets e tavolame in legno selezionati CER 170201",
      "quantity": "0.05",
      "unit": "t",
      "unitPrice": "150",
      "total_quantity": "1",
      "provider_name": "San Marco",
      "price_of_unity_provider": "150",
      "total_price": "7.5",
      "company_cost_eur": "7.5",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "8.625"
    },
    {
      "item": "Macerie pulite selezionate murature in pietrame",
      "quantity": "2",
      "unit": "m³",
      "unitPrice": "20.00",
      "total_quantity": "2",
      "provider_name": "San Marco",
      "price_of_unity_provider": "20",
      "total_price": "40",
      "company_cost_eur": "40",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "46"
    },
    {
      "item": "Listelli in legno",
      "quantity": "50",
      "unit": "m",
      "unitPrice": "1.50",
      "total_quantity": "50",
      "provider_name": "San Marco",
      "price_of_unity_provider": "1.50",
      "total_price": "75",
      "company_cost_eur": "75",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "86.25"
    },
    {
      "item": "Pavimento tavolette spessore 10 mm teak",
      "quantity": "1.1",
      "unit": "m²",
      "unitPrice": "40.00",
      "total_quantity": "100",
      "provider_name": "San Marco",
      "price_of_unity_provider": "40",
      "total_price": "4400",
      "company_cost_eur": "4400",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "5060"
    },
    {
      "item": "Adesivo per legno in secchi da 18 kg",
      "quantity": "0.8",
      "unit": "kg",
      "unitPrice": "2.50",
      "total_quantity": "20",
      "provider_name": "San Marco",
      "price_of_unity_provider": "2.50",
      "total_price": "40",
      "company_cost_eur": "40",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "46"
    },
    {
      "item": "Gel turapori per legno in secchi da 10 l",
      "quantity": "0.15",
      "unit": "l",
      "unitPrice": "6.00",
      "total_quantity": "10",
      "provider_name": "San Marco",
      "price_of_unity_provider": "6",
      "total_price": "9",
      "company_cost_eur": "9",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "10.35"
    },
    {
      "item": "Vernice di fondo per legno in latte da 5 l",
      "quantity": "0.25",
      "unit": "l",
      "unitPrice": "9.00",
      "total_quantity": "20",
      "provider_name": "San Marco",
      "price_of_unity_provider": "9",
      "total_price": "45",
      "company_cost_eur": "45",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "51.75"
    },
    {
      "item": "Pittura idropittura lavabile RÖFIX Primer PREMIUM (Bianco)",
      "quantity": "18",
      "unit": "kg",
      "unitPrice": "130.50",
      "total_quantity": "2",
      "provider_name": "RÖFIX",
      "price_of_unity_provider": "130.50",
      "total_price": "261",
      "company_cost_eur": "261",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "300.15"
    },
    {
      "item": "Maniglie per terrazzo in acciaio",
      "quantity": "10",
      "unit": "pezzo",
      "unitPrice": "25.00",
      "total_quantity": "10",
      "provider_name": "San Marco",
      "price_of_unity_provider": "25",
      "total_price": "250",
      "company_cost_eur": "250",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "287.5"
    }
  ],
  "personnel": [
    {
      "role": "Operatori addetti ai mezzi ed ai sollevamenti",
      "count": "2",
      "duration": "8 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto alla demolizione",
      "count": "3",
      "duration": "8 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto all'assistenza",
      "count": "2",
      "duration": "8 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatori addetti ai mezzi ed ai sollevamenti: LAVORI DI GENIO CIVILE - INDUSTRIA",
      "count": "1",
      "duration": "40 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto alla posa",
      "count": "4",
      "duration": "8 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto all'assistenza",
      "count": "3",
      "duration": "8 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatori addetti ai mezzi ed ai sollevamenti",
      "count": "2",
      "duration": "40 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto alla demolizione",
      "count": "4",
      "duration": "40 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Operatore addetto all'assistenza",
      "count": "3",
      "duration": "40 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Scavo e movimento terra",
      "unit_measure": "m3",
      "price_per_unit": "40",
      "quantity": "400",
      "total": "16000",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Fornitura e posa tubazioni",
      "unit_measure": "m",
      "price_per_unit": "65",
      "quantity": "200",
      "total": "13000",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Getto calcestruzzo armato",
      "unit_measure": "m3",
      "price_per_unit": "130",
      "quantity": "80",
      "total": "10400",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Posa pavimentazione industriale",
      "unit_measure": "m2",
      "price_per_unit": "50",
      "quantity": "250",
      "total": "12500",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Installazione impianto elettrico",
      "unit_measure": "punto_luce",
      "price_per_unit": "90",
      "quantity": "100",
      "total": "9000",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Subappaltatore - Verniciatura superfici",
      "unit_measure": "m2",
      "price_per_unit": "18",
      "quantity": "700",
      "total": "12600",
      "type": "subappaltatore",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Abilitazione per macchine operatrici",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    },
    {
      "role": "Pittori specializzati",
      "count": "3",
      "duration": "40 ore",
      "type": "dipendente",
      "site_works": [
        {
          "type": "Tinteggiatura",
          "category": "Manutenzione"
        }
      ],
      "safety_courses_requirements": [
        "Formazione specifica D.Lgs. 81/2008",
        "Assicurazione INAIL contro infortuni sul lavoro"
      ]
    }
  ],
  "logistics": [
    {
      "description": "Trasporto materiali",
      "duration": "10",
      "unity": "ore",
      "total_price": "300",
      "site_category": [
        "Problemi strutturali",
        "Stato del terrazzo"
      ],
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ]
    },
    {
      "description": "Carico e scarico materiali",
      "duration": "15",
      "unity": "ore",
      "total_price": "450",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ]
    },
    {
      "description": "Movimentazione materiali",
      "duration": "12",
      "unity": "ore",
      "total_price": "360",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        },
        {
          "type": "Rinforzo",
          "category": "Problemi strutturali"
        }
      ]
    },
    {
      "description": "Pernottamento",
      "duration": "300",
      "unity": "ore",
      "total_price": "900",
      "site_works": [
        "tutti"
      ]
    },
    {
      "description": "Pasti",
      "duration": "80",
      "unity": "ore",
      "total_price": "480",
      "site_works": [
        "tutti"
      ]
    },
    {
      "description": "Carburante",
      "duration": "400",
      "unity": "litri",
      "total_price": "800",
      "site_works": [
        "tutti"
      ]
    },
    {
      "description": "Trasporto macerie a discarica",
      "duration": "5",
      "unity": "viaggi",
      "total_price": "500",
      "site_works": [
        {
          "type": "Demolizione",
          "category": "Problemi strutturali"
        }
      ]
    }
  ],
  "direct_costs": [
    {
      "category": "Acquisizione sito",
      "description": "Costo acquisto terreno",
      "unit": "forfait",
      "price": "200000",
      "total_price": "200000"
    },
    {
      "category": "Preparazione sito",
      "description": "Pulizia e rimozione vegetazione e detriti",
      "unit": "m2",
      "price": "6",
      "total_price": "18000"
    },
    {
      "category": "Preparazione sito",
      "description": "Scavo e movimento terra",
      "unit": "m3",
      "price": "15",
      "total_price": "45000"
    },
    {
      "category": "Infrastruttura sito",
      "description": "Installazione sistema drenaggio acque piovane",
      "unit": "m",
      "price": "90",
      "total_price": "45000"
    },
    {
      "category": "Infrastruttura sito",
      "description": "Allacciamenti acqua e fognatura",
      "unit": "forfait",
      "price": "30000",
      "total_price": "30000"
    },
    {
      "category": "Strutture sito",
      "description": "Allestimento ufficio sito temporaneo",
      "unit": "forfait",
      "price": "15000",
      "total_price": "15000"
    },
    {
      "category": "Sicurezza e conformità",
      "description": "Valutazione impatto ambientale",
      "unit": "forfait",
      "price": "10000",
      "total_price": "10000"
    },
    {
      "category": "Test e rilevamenti",
      "description": "Test geotecniche suolo",
      "unit": "forfait",
      "price": "7000",
      "total_price": "7000"
    },
    {
      "category": "Permessi e approvazioni",
      "description": "Permessi edilizi e utilities",
      "unit": "forfait",
      "price": "6000",
      "total_price": "6000"
    },
    {
      "category": "Demolizione aggiuntiva",
      "description": "Demolizione strutture esistenti",
      "unit": "mc",
      "price": "50",
      "total_price": "25000"
    }
  ],
  "indirect_costs": [
    {
      "category": "Gestione progetto e supervisione",
      "description": "Stipendi project manager, ingegneri sito e supervisori",
      "unit": "mese",
      "price": "18000",
      "total_price": "108000"
    },
    {
      "category": "Strutture sito temporanee",
      "description": "Noleggio e allestimento uffici sito, bagni e magazzini",
      "unit": "forfait",
      "price": "15000",
      "total_price": "15000"
    },
    {
      "category": "Utilities sito",
      "description": "Elettricità, acqua e internet temporanei per operazioni sito",
      "unit": "mese",
      "price": "2500",
      "total_price": "15000"
    },
    {
      "category": "Sovraccosti attrezzature",
      "description": "Noleggio attrezzature non specifiche come gru a torre, carrelli elevatori, ponteggi",
      "unit": "mese",
      "price": "10000",
      "total_price": "60000"
    },
    {
      "category": "Salute, sicurezza e protezione",
      "description": "Ufficiali sicurezza, DPI, guardie sicurezza, stazioni primo soccorso",
      "unit": "forfait",
      "price": "12000",
      "total_price": "12000"
    },
    {
      "category": "Assicurazione qualità e test",
      "description": "Test e ispezioni generali non legate a compiti specifici",
      "unit": "forfait",
      "price": "6000",
      "total_price": "6000"
    },
    {
      "category": "Assicurazioni e garanzie",
      "description": "Assicurazione all-risk contraente e garanzie performance",
      "unit": "forfait",
      "price": "18000",
      "total_price": "18000"
    },
    {
      "category": "Amministrazione sito",
      "description": "Forniture ufficio, stampa, telefoni, internet e altri costi amministrativi",
      "unit": "mese",
      "price": "2000",
      "total_price": "12000"
    },
    {
      "category": "Gestione rifiuti",
      "description": "Raccolta rifiuti sito generale, noleggio cassonetti e costi trasporto",
      "unit": "mese",
      "price": "1200",
      "total_price": "7200"
    },
    {
      "category": "Sovraccosti aziendali",
      "description": "Costi ufficio centrale allocati al progetto: HR, finanza, IT, stipendi management",
      "unit": "percentuale_costo_progetto",
      "price": "0.06",
      "total_price": "60000"
    },
    {
      "category": "Formazione e conformità",
      "description": "Formazione sicurezza, certificazioni e programmi conformità ambientale",
      "unit": "forfait",
      "price": "4000",
      "total_price": "4000"
    },
    {
      "category": "Costi assicurativi aggiuntivi",
      "description": "Assicurazioni specifiche per rischi cantiere",
      "unit": "forfait",
      "price": "5000",
      "total_price": "5000"
    }
  ],
  "projectSchedule": [
    {
      "activity": "Problemi strutturali",
      "starting": "1",
      "finishing": "5",
      "personnel": [
        {
          "role": "Operatori addetti ai mezzi ed ai sollevamenti",
          "count": "2",
          "duration": "8 ore"
        },
        {
          "role": "Operatore addetto alla demolizione",
          "count": "3",
          "duration": "8 ore"
        }
      ]
    },
    {
      "activity": "Stato del terrazzo",
      "starting": "6",
      "finishing": "12",
      "personnel": [
        {
          "role": "Operatori addetti ai mezzi ed ai sollevamenti",
          "count": "3",
          "duration": "40 ore"
        },
        {
          "role": "Operatore addetto alla posa",
          "count": "2",
          "duration": "40 ore"
        }
      ]
    },
    {
      "activity": "Idraulica",
      "starting": "13",
      "finishing": "20",
      "personnel": [
        {
          "role": "Operatori addetti ai mezzi ed ai sollevamenti",
          "count": "2",
          "duration": "40 ore"
        },
        {
          "role": "Operatori addetti ai mezzi ed ai sollevamenti",
          "count": "1",
          "duration": "8 ore"
        },
        {
          "role": "Idraulici specializzati",
          "count": "4",
          "duration": "40 ore"
        }
      ]
    },
    {
      "activity": "Elettrico",
      "starting": "21",
      "finishing": "28",
      "personnel": [
        {
          "role": "Elettricisti certificati",
          "count": "3",
          "duration": "40 ore"
        },
        {
          "role": "Assistenti elettricisti",
          "count": "2",
          "duration": "40 ore"
        }
      ]
    },
    {
      "activity": "Riscaldamento",
      "starting": "29",
      "finishing": "30",
      "personnel": [
        {
          "role": "Tecnici riscaldamento",
          "count": "2",
          "duration": "16 ore"
        },
        {
          "role": "Assistenti",
          "count": "1",
          "duration": "16 ore"
        }
      ]
    },
    {
      "activity": "Finestre e porte",
      "starting": "31",
      "finishing": "36",
      "personnel": [
        {
          "role": "Falegnami installatori",
          "count": "4",
          "duration": "48 ore"
        },
        {
          "role": "Assistenti falegnami",
          "count": "2",
          "duration": "48 ore"
        }
      ]
    },
    {
      "activity": "Porte",
      "starting": "37",
      "finishing": "46",
      "personnel": [
        {
          "role": "Installatori porte",
          "count": "3",
          "duration": "80 ore"
        },
        {
          "role": "Assistenti",
          "count": "2",
          "duration": "80 ore"
        }
      ]
    },
    {
      "activity": "Soffitto",
      "starting": "47",
      "finishing": "62",
      "personnel": [
        {
          "role": "Muratori per soffitti",
          "count": "5",
          "duration": "120 ore"
        },
        {
          "role": "Assistenti muratori",
          "count": "3",
          "duration": "120 ore"
        }
      ]
    },
    {
      "activity": "Pareti",
      "starting": "63",
      "finishing": "86",
      "personnel": [
        {
          "role": "Muratori per pareti",
          "count": "6",
          "duration": "192 ore"
        },
        {
          "role": "Assistenti",
          "count": "4",
          "duration": "192 ore"
        }
      ]
    },
    {
      "activity": "Pavimentazione",
      "starting": "87",
      "finishing": "112",
      "personnel": [
        {
          "role": "Posatori pavimenti",
          "count": "5",
          "duration": "200 ore"
        },
        {
          "role": "Assistenti posatori",
          "count": "3",
          "duration": "200 ore"
        }
      ]
    },
    {
      "activity": "Impianti",
      "starting": "113",
      "finishing": "114",
      "personnel": [
        {
          "role": "Tecnici impianti",
          "count": "3",
          "duration": "16 ore"
        },
        {
          "role": "Assistenti tecnici",
          "count": "2",
          "duration": "16 ore"
        }
      ]
    },
    {
      "activity": "Pulizia generale",
      "starting": "115",
      "finishing": "122",
      "personnel": [
        {
          "role": "Squadra pulizia",
          "count": "4",
          "duration": "64 ore"
        }
      ]
    },
    {
      "activity": "Tinteggiatura finale",
      "starting": "123",
      "finishing": "130",
      "personnel": [
        {
          "role": "Pittori specializzati",
          "count": "3",
          "duration": "40 ore"
        }
      ]
    }
  ],
  "equipment": [
    {
      "name": "GRU ELEVATRICE CON ROTAZIONE IN ALTO",
      "quantity": "0.1",
      "unity": "ora",
      "price_per_unit": "12.00",
      "price_of_unity_provider": "12.00",
      "company_cost_eur": "1.20",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "1.38"
    },
    {
      "name": "AUTOCARRI A CASSA RIBALTABILE",
      "quantity": "0.08",
      "unity": "ora",
      "price_per_unit": "28.00",
      "price_of_unity_provider": "28.00",
      "company_cost_eur": "2.24",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "2.576"
    },
    {
      "name": "MARTELLI DEMOLITORI",
      "quantity": "5",
      "unity": "giorno",
      "price_per_unit": "30.00",
      "price_of_unity_provider": "30.00",
      "company_cost_eur": "150",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "172.5"
    },
    {
      "name": "FURGONE CASSONATO",
      "quantity": "10",
      "unity": "giorno",
      "price_per_unit": "100.00",
      "price_of_unity_provider": "100.00",
      "company_cost_eur": "1000",
      "markup_percentage": "0.15",
      "final_cost_for_client_eur": "1150"
    }
  ],
  "price_summary": {
    "subtotal_price": "105000",
    "global_costs": "15000",
    "company_profit": "20000",
    "margin_check": "20000",
    "markup": "15750",
    "rounding": "0",
    "total_costs": "155750",
    "application_price": "155750",
    "explanation_of_summary": {
      "subtotal_desc": "Somma di tutti i costi diretti del progetto.",
      "global_costs_desc": "Spese globali che coprono i costi indiretti del progetto.",
      "company_profit_desc": "Margine di profitto della compagnia.",
      "margin_check_desc": "Verifica del margine di profitto calcolato.",
      "markup_desc": "Markup applicato ai costi.",
      "rounding_desc": "Arrotondamento del totale.",
      "total_amount_desc": "Totale del progetto dopo l'aggiunta delle spese globali e del profitto.",
      "application_price_desc": "Prezzo finale applicato al cliente."
    },
    "summary_by_category": {
      "fuel_cost": "6000",
      "activity_cost": "12000",
      "workers_cost": "15000",
      "subcontractors_cost": "12000",
      "equipment_cost": "12000",
      "production_labor_cost": "35000",
      "material_cost_fc": "25000",
      "material_cost_fm": "18000"
    }
  },
  "deprecation_fixed_amount": [
    {
      "component": "Gru elevatrice",
      "depreciation_eur": "6000",
      "percentage": "12",
      "rounding": "0"
    },
    {
      "component": "Autocarro ribaltabile",
      "depreciation_eur": "4000",
      "percentage": "12",
      "rounding": "0"
    },
    {
      "component": "Macchine edili",
      "depreciation_eur": "2500",
      "percentage": "12",
      "rounding": "0"
    },
    {
      "component": "Martelli demolitori",
      "depreciation_eur": "1000",
      "percentage": "10",
      "rounding": "0"
    }
  ],
  "risk_analysis": {
    "potential_risks": "Ritardi nei fornitori, condizioni meteorologiche avverse, problemi di sicurezza sul cantiere.",
    "cash_flow_risks": "Ritardi nei pagamenti da parte del cliente.",
    "simulation": "Simulazione di scenari di rischio per valutare l'impatto sul progetto.",
    "timeline_simulation": "Simulazione del cronoprogramma per identificare potenziali ritardi."
  }
}


def escape_curly_braces(s: str) -> str:
    return s.replace('{', '{{').replace('}', '}}')

# boq_str = escape_curly_braces(json.dumps(boq, ensure_ascii=False, indent=2))
internal_costs_str = escape_curly_braces(json.dumps(internal_costs, ensure_ascii=False, indent=2))

# Read activity keywords from file
with open(os.path.join(os.path.dirname(__file__), 'activity_keywords.txt'), 'r', encoding='utf-8') as f:
    activity_keywords = f.read().strip()

messages = [
  (
    "system",
    f"Based on the provided site visit timeline and description and bill of quantities, return only a valid JSON object as specified. Do not include any explanation, markdown, or commentary. Do not wrap the JSON in code blocks. Output only the JSON. Based on the book https://psu.pb.unizin.org/buildingconstructionmanagement/ and following standard: {activity_keywords}. Do site price quotation planning in right order of construction timeline, you should prepare object in JSON format in exact following structure with internal_costs: {internal_costs_str}. Do not use the same values as given JSON but generate new proposal from provided details of construction site. You must evaluate the project as an expert construction engineer to prepare price quotation and internal costs official report, add all necessary construction works for the site in the correct order according to the timeline and construction standard and calculate total price for each resource based on quantity, dimensions, unity of price, formula, if quantity or measures are not clear you should estimate it from site description. You should estimate what is required and what is not according to the provided construction timeline. Logistics includes cost of the gas from vehicle in working area and the hotel if workers are far away from starting point and meals for the workers when staying overnight. You must include it in overhead costs. If the prices are not provided you should search only from the trusted sources like PAT Prezziario http://www.elencoprezzi2025.provincia.tn.it. You should update and include timeline. The original site information with timeline, site description and draft bill of quantities is following:",
  ),
  ("human", "{input}"),
]

prompt = ChatPromptTemplate.from_messages(messages)
chain = prompt | llm

def create_quotation(query: str) -> str:
    response = chain.invoke({
        "input": query,
    })
        # Model loading logic can be added here if needed
    try:
        parsed_output = response.content
        return json.dumps(parsed_output, ensure_ascii=False)
    except Exception:
        return response.content.strip()

