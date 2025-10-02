import Swal from "sweetalert2";

// Mapa za prevod grešaka sa engleskog na srpski
const errorTranslations = {
  "Unable to log in with provided credentials.":
    "Pogrešno korisničko ime ili lozinka.",
  "No active account found with the given credentials.":
    "Pogrešno korisničko ime ili lozinka.",
  "This field is required.": "Ovo polje je obavezno.",
  "Enter a valid email address.": "Unesite ispravnu email adresu.",
  "Password must be at least 8 characters.":
    "Lozinka mora imati najmanje 8 karaktera.",
  "The two password fields didn't match.": "Lozinke se ne poklapaju.",
  "A user with that username already exists.":
    "Korisnik sa ovim korisničkim imenom već postoji.",
  "Invalid token.": "Nevažeći token.",
  "Token is blacklisted.": "Token je blokiran.",
  "Authentication credentials were not provided.":
    "Niste uneli podatke za prijavu.",
  "You do not have permission to perform this action.":
    "Nemate dozvolu za ovu akciju.",
  "Not found.": "Stranica nije pronađena.",
  "Method not allowed.": "Metoda nije dozvoljena.",
  "Server error.": "Greška na serveru.",
  "Bad request.": "Neispravan zahtev.",
};

export const showSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "Uspeh!",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "Greška",
    text: message,
    confirmButtonText: "U redu",
  });
};

export const showConfirm = (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Da",
    cancelButtonText: "Ne",
  });
};

// Poboljšana funkcija za prevod grešaka
export const showApiError = (error) => {
  let errorMessage = "Došlo je do greške!";

  if (error.response?.data) {
    const errors = error.response.data;

    if (typeof errors === "object") {
      // Ako su greške u poljima (npr. {username: ['...'], password: ['...']})
      const errorMessages = Object.values(errors).flat();

      // Prevedi svaku grešku
      const translatedErrors = errorMessages.map((msg) => {
        // Proveri da li postoji prevod za ovu grešku
        return errorTranslations[msg] || msg;
      });

      errorMessage = translatedErrors.join("\n");
    } else if (typeof errors === "string") {
      // Prevedi string grešku
      errorMessage = errorTranslations[errors] || errors;
    } else if (errors.error) {
      errorMessage = errorTranslations[errors.error] || errors.error;
    } else if (errors.detail) {
      errorMessage = errorTranslations[errors.detail] || errors.detail;
    }
  } else if (error.message) {
    errorMessage = errorTranslations[error.message] || error.message;
  }

  return Swal.fire({
    icon: "error",
    title: "Greška",
    html: errorMessage.replace(/\n/g, "<br>"),
    confirmButtonText: "U redu",
  });
};

// Specijalna funkcija samo za login greške - POPRAVLJENA
export const showLoginError = (error) => {
  console.log("Login error details:", error); // Dodajte ovo za debug

  let errorMessage = "Pogrešno korisničko ime ili lozinka.";

  if (error.response?.data) {
    const errors = error.response.data;
    console.log("Error response data:", errors); // Dodajte ovo za debug

    // Proveri različite formate grešaka
    if (errors.detail) {
      // Ovo je format koji koristi Django REST framework
      errorMessage =
        errorTranslations[errors.detail] ||
        "Pogrešno korisničko ime ili lozinka.";
    } else if (
      errors.non_field_errors &&
      Array.isArray(errors.non_field_errors)
    ) {
      // Ako su greške u non_field_errors nizu
      errorMessage = errors.non_field_errors
        .map((msg) => errorTranslations[msg] || msg)
        .join("\n");
    } else if (typeof errors === "string") {
      // Ako je greška string
      errorMessage = errorTranslations[errors] || errors;
    } else {
      // Pokušaj da pronađeš bilo koju grešku u objektu
      const allErrorValues = Object.values(errors).flat();
      if (allErrorValues.length > 0) {
        const firstError = allErrorValues[0];
        errorMessage = errorTranslations[firstError] || firstError;
      }
    }
  }

  // Ako je poruka još uvek na engleskom, zameni je sa srpskom
  if (
    errorMessage.includes("No active account found with the given credentials")
  ) {
    errorMessage = "Pogrešno korisničko ime ili lozinka.";
  }

  return Swal.fire({
    icon: "error",
    title: "Greška pri prijavi",
    text: errorMessage,
    confirmButtonText: "U redu",
  });
};
