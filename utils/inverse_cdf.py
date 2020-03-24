from itertools import zip_longest
from math import pi, sqrt, factorial
from typing import List, Union

import numpy as np


class InverseCDF:
    def __init__(self, power: int) -> None:
        """
        Store Taylor series coefficients of erfinv
        :param power: highest power of the Taylor series (one less than the number of terms due to constant term)
        """
        self.taylor_coeffs = self.get_taylor_coeffs(power + 1)

    def update_P(self, P: List[int], n: int) -> List[int]:
        """
        Update polynomial for each term of Taylor series approximation of erfinv
        :param P: polynomial of previous power (one less than current power)
        :param n: power of current term
        :return: polynomial of current power term
        """
        EP = [0] + P
        two_nEP = [2 * n * coeff for coeff in EP]
        dP = [power * coeff for power, coeff in enumerate(P)][1:]
        updated_P = [two_nEP_coeff + dP_coeff for two_nEP_coeff, dP_coeff in zip_longest(two_nEP, dP, fillvalue=0)]
        return updated_P

    def get_taylor_coeffs(self, n_terms: int) -> List[int]:
        """
        Get coefficients of Taylor series approximation for erfinv (up to specified number of terms)
        :param n_terms: number of terms of Taylor series
        :return: list of Taylor series coefficients matching number of terms
        """
        taylor_coeffs = [0, sqrt(pi) / 2]  # First two coefficients

        if n_terms <= 2:
            return taylor_coeffs[:n_terms]
        else:
            P = [0, 2]  # Polynomial of second derivative
            dE = sqrt(pi) / 2  # First derivative at x = 0

            # Find Taylor coefficient for each term from x^2 onwards
            for n in range(2, n_terms):
                P_const = P[0]
                taylor_coeff = (dE ** n * P_const) / factorial(n)
                P = self.update_P(P, n)
                taylor_coeffs.append(taylor_coeff)
            return taylor_coeffs

    def calculate_sample(self, A: Union[float, np.array]) -> Union[float, np.array]:
        """
        Return Gaussian sample(s) from sampled left-side area(s)
        :param A: sampled left-side area(s), can be a single float or a numpy float array
        :return: Gaussian sample(s) from applying inverse CDF to sampled area(s), can be single float or numpy float array
        """
        sample = sqrt(2) * sum(coeff * (2*A-1) ** power for power, coeff in enumerate(self.taylor_coeffs))
        return sample